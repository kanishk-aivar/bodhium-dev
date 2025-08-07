import asyncio
import time
import json
import boto3
import os
import google.generativeai as genai
from datetime import datetime

# CRITICAL: Monkey patch database creation BEFORE importing crawl4ai
# The crawl4ai library creates database files during import, not during initialization
import tempfile
tmp_dir = tempfile.gettempdir()

# Create directories that crawl4ai might need
os.makedirs(os.path.join(tmp_dir, '.crawl4ai'), exist_ok=True)
os.makedirs(os.path.join(tmp_dir, '.crawl4ai_cache'), exist_ok=True)

# Set environment variables for crawl4ai to use /tmp (writable in Lambda)
os.environ['CRAWL4AI_DB_PATH'] = os.path.join(tmp_dir, '.crawl4ai')
os.environ['CRAWL4AI_CACHE_DIR'] = os.path.join(tmp_dir, '.crawl4ai_cache')
os.environ['CRAWL4AI_BASE_DIRECTORY'] = tmp_dir
os.environ['DB_PATH'] = os.path.join(tmp_dir, '.crawl4ai')

# Monkey patch os.makedirs to redirect read-only paths to writable ones
original_makedirs = os.makedirs
def safe_makedirs(path, mode=0o777, exist_ok=False):
    if '/home/sbx_user' in path or '/home/' in path:
        # Redirect to writable location
        if '/home/sbx_user1051' in path:
            redirected_path = path.replace('/home/sbx_user1051', tmp_dir)
        elif '/home/sbx_user' in path:
            redirected_path = path.replace('/home/sbx_user', tmp_dir)
        else:
            redirected_path = path.replace('/home/', f'{tmp_dir}/')
        print(f"DEBUG: Redirecting {path} to {redirected_path}")
        return original_makedirs(redirected_path, mode, exist_ok)
    return original_makedirs(path, mode, exist_ok)

os.makedirs = safe_makedirs

print("DEBUG: Using crawl4ai with no database/cache storage")

import google.generativeai as genai
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async
from crawl4ai import AsyncWebCrawler
import re
import random

# Setup Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required. Please set it before running the script.")
genai.configure(api_key=GEMINI_API_KEY)

# Use the correct model name based on Google AI Studio
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
except:
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
    except:
        try:
            model = genai.GenerativeModel('gemini-pro')
        except:
            # Fallback to the most common model name
            model = genai.GenerativeModel('gemini-1.0-pro')

def preprocess_raw_response(raw_text: str) -> str:
    """Enhanced preprocessing to make table structure more apparent"""
    import re
    
    # Remove extra whitespace
    processed = ' '.join(raw_text.split())
    
    # Add line breaks before price patterns (currency symbols)
    processed = re.sub(r'([a-zA-Z\s])([₹$€£¥])(\d)', r'\1\n\2\3', processed)
    
    # Add line breaks before common table headers
    processed = re.sub(r'([a-z])([A-Z][a-z]*\s[A-Z][a-z]*)', r'\1\n\2', processed)
    
    # Add line breaks before sequential patterns that look like new rows
    processed = re.sub(r'([a-z\d])\s*([A-Z][a-z]+\s[A-Z][a-z]+\s[A-Z0-9])', r'\1\n\2', processed)
    
    # Clean up multiple newlines
    processed = re.sub(r'\n+', '\n', processed)
    
    return processed

def is_openai_related(url: str, text: str = "") -> bool:
    """
    Check if a URL or text is related to OpenAI/ChatGPT UI elements
    """
    openai_domains = [
        'openai.com',
        'help.openai.com',
        'chat.openai.com',
        'platform.openai.com'
    ]
    
    openai_keywords = [
        'terms', 'privacy', 'cookie', 'policy', 'help', 'learn more',
        'cookie policy', 'privacy policy', 'terms of service',
        'manage cookies', 'accept all', 'reject', 'close'
    ]
    
    # Check URL
    url_lower = url.lower()
    for domain in openai_domains:
        if domain in url_lower:
            return True
    
    # Check text content
    text_lower = text.lower()
    for keyword in openai_keywords:
        if keyword in text_lower:
            return True
    
    return False

def extract_citations_from_text(text: str) -> list:
    """Extract and separate citations from text content, handling +n patterns"""
    citations = []
    
    # Pattern to match citation blocks like [The Times of India+14IndiCar+14GearChoice+14]
    citation_pattern = r'\[([^\]]+)\]'
    
    # Find all citation blocks
    citation_blocks = re.findall(citation_pattern, text)
    
    for block in citation_blocks:
        # Split by '+' to separate individual citations
        individual_citations = re.split(r'\+\d+', block)
        
        for citation in individual_citations:
            citation = citation.strip()
            if citation and len(citation) > 2:  # Filter out empty or very short citations
                # Clean up the citation name
                citation = re.sub(r'^\s+|\s+$', '', citation)  # Remove leading/trailing whitespace
                if citation not in citations:
                    citations.append(citation)
    
    return citations

def clean_raw_response_text(text: str) -> str:
    """Clean raw response text by separating combined citations"""
    if not text:
        return text
    
    # Pattern to match citation blocks with URLs like [Reddit+2Times Drive+2Times Drive+2](url)
    citation_url_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    
    def replace_citation_block(match):
        citation_block = match.group(1)
        url = match.group(2)
        
        # Split the citation block by '+' patterns
        individual_citations = re.split(r'\+\d+', citation_block)
        
        # Clean up each citation
        cleaned_citations = []
        for citation in individual_citations:
            citation = citation.strip()
            if citation and len(citation) > 2:
                cleaned_citations.append(citation)
        
        # Create separate citation blocks
        if cleaned_citations:
            # For now, just use the first citation with the URL
            # In a more advanced version, we could try to match citations to specific URLs
            return f'[{cleaned_citations[0]}]({url})'
        else:
            return match.group(0)  # Return original if no valid citations
    
    # Replace all citation blocks
    cleaned_text = re.sub(citation_url_pattern, replace_citation_block, text)
    
    return cleaned_text

def extract_links_and_citations(text: str, crawl_result=None) -> tuple:
    """Extract links and citations from text and crawl4ai result, excluding OpenAI-related content"""
    # Pattern for URLs in text
    url_pattern = r'https?://[^\s<>"\'{}|\\^`\[\]]+|www\.[^\s<>"\'{}|\\^`\[\]]+\.[a-z]{2,}'
    text_links = re.findall(url_pattern, text, re.IGNORECASE)
    
    # Filter out OpenAI-related URLs from text links
    filtered_text_links = []
    for link in text_links:
        if not is_openai_related(link):
            filtered_text_links.append(link)
    
    # Extract citations from text content first
    text_citations = extract_citations_from_text(text)
    print(f"📝 Extracted {len(text_citations)} citations from text: {text_citations}")
    
    # Citations will be extracted from links only, in name: url format
    citations = {}  # Changed to dict for name: url format
    citation_links = {}
    html_links = []
    
    # Add text citations to citations dict (without URLs for now)
    for citation in text_citations:
        if citation not in citations:
            citations[citation] = ""  # Empty URL for now, will be filled later if found
    
    # Extract clickable links from crawl4ai result if provided
    if crawl_result and hasattr(crawl_result, 'links'):
        print(" Analyzing crawl4ai result for clickable links...")
        
        # Extract links from crawl4ai result
        for link in crawl_result.links:
            if hasattr(link, 'url') and hasattr(link, 'text'):
                href = link.url
                link_text = link.text.strip()
                
                if href and link_text:
                    # Clean up href (handle relative URLs)
                    if href.startswith('http'):
                        full_url = href
                    elif href.startswith('//'):
                        full_url = 'https:' + href
                    elif href.startswith('/'):
                        full_url = 'https://chatgpt.com' + href
                    else:
                        full_url = href
                    
                    # Filter out OpenAI-related links
                    if not is_openai_related(full_url, link_text):
                        # Add to HTML links
                        if full_url not in html_links:
                            html_links.append(full_url)
                        
                        print(f"Link: '{link_text}' -> {full_url}")
                        
                        # Store citation to link mapping
                        citation_links[link_text] = full_url
                        
                        # Add link text as citation in name: url format
                        if len(link_text) > 2 and not is_openai_related("", link_text):
                            if link_text not in citations:
                                citations[link_text] = full_url
                            else:
                                # Update existing citation with URL if it was empty
                                if not citations[link_text]:
                                    citations[link_text] = full_url
    
    # Combine all links (use filtered text links)
    all_links = filtered_text_links + html_links
    
    # Remove duplicates while preserving order
    unique_links = list(dict.fromkeys(all_links))
    
    print(f" Extraction summary:")
    print(f"   Text links: {len(text_links)}")
    print(f"   HTML links: {len(html_links)}")
    print(f"   Total unique links: {len(unique_links)}")
    print(f"   Citations: {len(citations)}")
    print(f"   Citation-link mappings: {len(citation_links)}")
    
    return unique_links, citations, citation_links

def detect_table_structure(text: str) -> dict:
    """Detect potential table structure in text"""
    lines = text.split('\n')
    table_indicators = []
    
    # Look for common table patterns
    patterns = {
        'price_pattern': r'[₹$€£¥]\s*[\d,]+',
        'model_pattern': r'[A-Z][a-z]+\s+[A-Z0-9][a-z0-9\s]*\d*',
        'spec_pattern': r'\d+\.?\d*\s*(MP|GB|mAh|inch|GHz)',
    }
    
    potential_rows = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Count how many patterns match in this line
        pattern_matches = sum(1 for pattern in patterns.values() if re.search(pattern, line))
        
        if pattern_matches >= 2:  # If multiple patterns match, likely a table row
            potential_rows.append({
                'line_number': i,
                'content': line,
                'pattern_matches': pattern_matches
            })
    
    return {
        'potential_rows': potential_rows,
        'total_rows': len(potential_rows),
        'has_table_structure': len(potential_rows) >= 2
    }

def format_with_gemini(raw_response: str, query: str, crawl_result=None) -> dict:
    """
    Enhanced Gemini formatting with better table detection and parsing
    """
    # Preprocess text
    preprocessed_text = preprocess_raw_response(raw_response)
    
    # Extract links and citations first (now with crawl4ai result support)
    links, citations, citation_links = extract_links_and_citations(raw_response, crawl_result)
    
    # Detect table structure
    table_info = detect_table_structure(preprocessed_text)
    
    # Enhanced prompt with more specific instructions
    prompt = f"""
You are an expert data extraction specialist. Your task is to parse unstructured text and convert it into properly structured JSON format.

TASK: Analyze the following text and extract structured data based on the user query.

USER QUERY: {query}

RAW TEXT TO ANALYZE:
{preprocessed_text}

EXTRACTION RULES:

1. CONTENT CLASSIFICATION:
   - **Lists**: Numbered or bulleted lists, itemized information
   - **Tables**: Structured data with clear rows and columns
   - **Links**: URLs or web references
   - **Citations**: Source attributions, company names, references
   - **Content**: Explanatory text, introductions, conclusions

2. FORMAT PRESERVATION:
   - If the original content is a LIST, keep it as a LIST
   - If the original content is a TABLE, keep it as a TABLE
   - Do NOT force lists into table format
   - Preserve the original structure

3. LIST DETECTION:
   - Numbered items (1., 2., 3.)
   - Bulleted items (•, -, *)
   - Items with headings followed by descriptions
   - Brand/Product lists with descriptions

4. TABLE DETECTION:
   - Only use tables for data with clear columns (Product, Price, Specs, etc.)
   - Look for repeating data patterns with consistent structure
   - Identify currency symbols, specifications, prices

5. CITATION DETECTION:
   - Citations are in format: "name": "url"
   - Extract: External website links with their names
   - Include: Research websites, official company sites, news sources
   - Format: "Counterpoint Research": "https://www.counterpointresearch.com"
   - Handle combined citations like [The Times of India+14IndiCar+14GearChoice+14] by separating into individual citations
   - Separate citations by '+' patterns: "The Times of India", "IndiCar", "GearChoice"
   - Exclude: Main subject matter (brand names, product names in lists)

EXAMPLE OUTPUT FOR LISTS:
{{
    "lists": [
        {{
            "title": "Top 5 Car Brands",
            "items": [
                {{
                    "name": "Maruti Suzuki",
                    "model": "Maruti Suzuki Swift",
                    "description": "Swift has been a long-time favorite..."
                }},
                {{
                    "name": "Hyundai", 
                    "model": "Hyundai Creta",
                    "description": "The Creta is one of India's best-selling SUVs..."
                }}
            ]
        }}
    ],
    "tables": [],
    "links": [],
    "citations": [],
    "content": ""
}}

EXAMPLE OUTPUT FOR TABLES:
{{
    "tables": [
        {{
            "title": "Product Comparison",
            "headers": ["Product", "Price", "Features"],
            "rows": [
                {{"cells": ["iPhone 14", "₹1,29,900", "A16 Bionic, 48MP"]}},
                {{"cells": ["Samsung S23", "₹74,999", "Dynamic AMOLED, 50MP"]}}
            ]
        }}
    ],
    "lists": [],
    "links": [],
    "citations": ["Apple", "Samsung", "Counterpoint Research", "Canalys"],
    "content": ""
}}

EXAMPLE OUTPUT FOR CITATIONS:
{{
    "lists": [
        {{
            "title": "Top Smartphone Brands",
            "items": [
                {{"name": "Apple", "description": "iPhone manufacturer"}},
                {{"name": "Samsung", "description": "Galaxy series"}}
            ]
        }}
    ],
    "tables": [],
    "links": ["https://www.counterpointresearch.com", "https://www.canalys.com"],
    "citations": {{
        "The Times of India": "https://www.timesofindia.com",
        "IndiCar": "https://www.indicar.in", 
        "GearChoice": "https://www.gearchoice.in",
        "Counterpoint Research": "https://www.counterpointresearch.com",
        "Canalys": "https://www.canalys.com"
    }},
    "content": "According to The Times of India and IndiCar, Apple leads in premium segment..."
}}

CRITICAL REQUIREMENTS:
- Preserve original format (lists vs tables)
- Do NOT force lists into table format
- Use "lists" array for list content
- Use "tables" array only for true table data
- Return ONLY valid JSON
- Strictly do not extract: [
      "https://openai.com/terms",
      "https://openai.com/privacy",
      "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",
      "https://openai.com/policies/cookie-policy/"
        ] these links or any links related to chatgpt or openai links. 

OUTPUT (JSON only):
"""
    
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean the response text
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback: try to extract JSON from the response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("No valid JSON found in response")
        
        # Enhance the result with extracted links and citations
        if not result.get("links"):
            result["links"] = links
        if not result.get("citations"):
            result["citations"] = citations
        
        # Add citation links mapping
        if citation_links:
            result["citation_links"] = citation_links
        
        return result
        
    except Exception as e:
        print(f"Error formatting with Gemini: {e}")
        
        # Fallback parsing when Gemini fails
        fallback_result = {
            "tables": [],
            "links": links,
            "citations": citations,
            "citation_links": citation_links,
            "content": raw_response,
            "error": str(e),
            "fallback_parsing": True
        }
        
        # Try basic table extraction as fallback
        if table_info['has_table_structure']:
            fallback_table = {
                "title": "Extracted Data",
                "headers": ["Content"],
                "rows": []
            }
            
            for row_info in table_info['potential_rows']:
                fallback_table["rows"].append({
                    "cells": [row_info['content']]
                })
            
            if fallback_table["rows"]:
                fallback_result["tables"].append(fallback_table)
                fallback_result["content"] = ""  # Move content to table
        
        return fallback_result

def upload_to_s3(data, bucket_name, s3_path):
    """
    Upload final processed data to S3 in the results/ subdirectory
    """
    try:
        s3_client = boto3.client('s3')
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"chatgpt_response_{timestamp}.json"
        s3_key = f"{s3_path}/results/{filename}"
        
        # Convert data to JSON string
        json_data = json.dumps(data, indent=2, ensure_ascii=False)
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json_data,
            ContentType='application/json'
        )
        
        print(f"Final result uploaded to S3: s3://{bucket_name}/{s3_key}")
        return s3_key
        
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None

def upload_html_to_s3(html_content, bucket_name, s3_path, timestamp):
    """
    Upload HTML content to S3 in the html/ subdirectory
    """
    try:
        s3_client = boto3.client('s3')
        
        # Upload HTML file to html/ subdirectory
        html_filename = f"chatgpt_response_{timestamp}.html"
        html_s3_key = f"{s3_path}/html/{html_filename}"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=html_s3_key,
            Body=html_content,
            ContentType='text/html'
        )
        
        print(f"HTML uploaded to S3: s3://{bucket_name}/{html_s3_key}")
        return html_s3_key
        
    except Exception as e:
        print(f"Error uploading HTML to S3: {e}")
        return None

def upload_markdown_to_s3(markdown_content, bucket_name, s3_path, timestamp):
    """
    Upload markdown content to S3 in the markdown/ subdirectory
    """
    try:
        s3_client = boto3.client('s3')
        
        # Upload markdown file to markdown/ subdirectory
        md_filename = f"chatgpt_response_{timestamp}.md"
        md_s3_key = f"{s3_path}/markdown/{md_filename}"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=md_s3_key,
            Body=markdown_content,
            ContentType='text/markdown'
        )
        
        print(f"Markdown uploaded to S3: s3://{bucket_name}/{md_s3_key}")
        return md_s3_key
        
    except Exception as e:
        print(f"Error uploading markdown to S3: {e}")
        return None


async def automate_chatgpt(query="list top 5 car brands with their best seler cars in india"):
    async with async_playwright() as p:
        # Launch Chromium browser with better settings for Lambda
        browser = await p.chromium.launch(
            headless=True,  # Must be headless in Lambda
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--single-process',  # Important for Lambda
                '--no-zygote'
            ]
        )
        
        # Create a new context with better settings
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            extra_http_headers={
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        )
        
        page = await context.new_page()
        
        # Apply stealth mode to avoid detection
        await stealth_async(page)
        
        try:
            print("Navigating to ChatGPT...")
            await page.goto('https://chatgpt.com', wait_until='networkidle')
            
            # Handle cookie consent
            await handle_cookie_consent(page)
            
            # Wait for any modals to disappear
            try:
                await page.wait_for_selector('[data-testid="modal-cookie-preferences"]', state='hidden', timeout=10000)
            except:
                pass  # Modal might not exist or already be hidden
            
            # Wait a bit for the page to fully load
            await asyncio.sleep(random.uniform(2, 4))
            
            # Look for the input textarea
            print("Looking for input field...")
            
            input_selectors = [
                'textarea[placeholder*="Message"]',
                'textarea[data-id="root"]',
                '#prompt-textarea',
                'div[contenteditable="true"]',
                'textarea',
                '[role="textbox"]'
            ]
            
            input_element = None
            for selector in input_selectors:
                try:
                    input_element = await page.wait_for_selector(selector, timeout=5000)
                    if input_element:
                        print(f"Found input using selector: {selector}")
                        break
                except:
                    continue
            
            if not input_element:
                print("Could not find input field. Taking screenshot for debugging...")
                await page.screenshot(path='/tmp/debug_screenshot.png')
                raise Exception("Input field not found")
            
            print(f"Typing query: {query}")
            
            # Clear any existing text and type the query
            await input_element.wait_for_element_state('stable', timeout=10000)
            await input_element.click(force=True)
            await page.keyboard.press('Control+a')
            await input_element.fill(query)
            
            # Wait a moment
            await asyncio.sleep(random.uniform(1, 2))
            
            # Press Enter to submit
            print("Submitting query...")
            await page.keyboard.press('Enter')
            
            # Wait for response with error handling
            print("Waiting for response...")
            response_success = await wait_for_response_with_error_handling(page)
            
            if not response_success:
                print("Failed to get a valid response after retries")
                # Save error screenshot
                await page.screenshot(path='/tmp/error_response.png')
                return None
            
            # Wait for response to be generated
            print("Waiting for response to be generated...")
            await asyncio.sleep(120)  # 2 minutes wait

            # Look for response container and wait for it to stop updating
            response_selectors = [
                '[data-message-author-role="assistant"]',
                '.markdown',
                '[class*="message"]',
                '[class*="response"]'
            ]

            # Wait for response to appear and stabilize
            max_wait_time = 120  # Keep at 2 minutes (120 seconds)
            start_time = time.time()
            response_detected = False
            last_response_length = 0
            stable_count = 0
            max_stable_count = 4  # Keep this as is

            print("Waiting for response to complete...")

            while time.time() - start_time < max_wait_time:
                try:
                    # Check for loading indicators more comprehensively
                    loading_indicators = await page.query_selector_all('[class*="loading"], [class*="thinking"], [class*="generating"], [class*="typing"], button:has-text("Stop generating"), [data-testid*="stop"]')
                    
                    # Also check for streaming text indicators
                    streaming_indicators = await page.query_selector_all('[class*="cursor"], [class*="blink"], [class*="animate"]')
                    
                    is_still_generating = len(loading_indicators) > 0 or len(streaming_indicators) > 0
                    
                    if not is_still_generating:
                        response_found = False
                        for selector in response_selectors:
                            response_elements = await page.query_selector_all(selector)
                            if response_elements:
                                current_response = await response_elements[-1].text_content()
                                current_length = len(current_response)
                                
                                if current_length > 0:
                                    response_found = True
                                    if not response_detected:
                                        print("Response detected, monitoring for completion...")
                                        response_detected = True
                                    
                                    if current_length == last_response_length:
                                        stable_count += 1
                                        print(f"Response stable for {stable_count}/{max_stable_count} checks...")
                                        if stable_count >= max_stable_count:
                                            print("Response appears to be complete!")
                                            # Extra wait to ensure completeness
                                            await asyncio.sleep(5)
                                            
                                            # Final check - make sure no new content is being added
                                            final_response = await response_elements[-1].text_content()
                                            if len(final_response) == current_length:
                                                print("Response confirmed complete!")
                                                break
                                            else:
                                                print("New content detected, continuing to wait...")
                                                stable_count = 0
                                                last_response_length = len(final_response)
                                    else:
                                        stable_count = 0
                                        last_response_length = current_length
                                        print(f"Response growing: {current_length} characters...")
                                    
                                    break
                            
                        if not response_found:
                            await asyncio.sleep(3)
                            continue
                        else:
                            if stable_count >= max_stable_count:
                                break
                    else:
                        print("Still generating... waiting...")
                        stable_count = 0
                        await asyncio.sleep(3)
                
                except Exception as e:
                    print(f"Error while waiting for response: {e}")
                    await asyncio.sleep(3)
                
                await asyncio.sleep(1.5)  # Reduced sleep time
            
            # Get page content
            print("Extracting response...")
            page_content = await page.content()
            
            # Create timestamp for file naming
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # STEP 1: Upload HTML content to S3
            S3_BUCKET = os.environ.get('S3_BUCKET', 'bodhium')
            S3_PATH = os.environ.get('S3_PATH', 'chat-gpt')
            
            print("Uploading HTML content to S3...")
            html_s3_key = upload_html_to_s3(page_content, S3_BUCKET, S3_PATH, timestamp)
            
            # Use crawl4ai to extract content from the ChatGPT page
            print("Using crawl4ai to extract content...")
            
            # Create directories with proper permissions
            os.makedirs('/tmp/.crawl4ai', exist_ok=True)
            os.makedirs('/tmp/.crawl4ai_cache', exist_ok=True)
            
            # Use crawl4ai with no storage to avoid database issues
            try:
                async with AsyncWebCrawler(
                    cache_mode="none",  # No caching at all
                    use_database=False,   # No database
                    cache_dir="/tmp/.crawl4ai_cache"
                ) as crawler:
                    # Create a temporary HTML file to parse with crawl4ai
                    temp_html_path = "/tmp/temp_chatgpt_response.html"
                    with open(temp_html_path, 'w', encoding='utf-8') as f:
                        f.write(page_content)
                    
                    try:
                        # Use crawl4ai to extract content from the HTML
                        crawl_result = await crawler.arun(
                            url=f"file://{os.path.abspath(temp_html_path)}"
                        )
                        
                        # Extract response text from crawl4ai result
                        response_text = crawl_result.markdown if hasattr(crawl_result, 'markdown') else ""
                        
                        # If crawl4ai didn't extract meaningful content, try alternative extraction
                        if not response_text or len(response_text.strip()) < 100:
                            # Try to get HTML content from crawl4ai
                            if hasattr(crawl_result, 'html'):
                                response_text = crawl_result.html
                            elif hasattr(crawl_result, 'text'):
                                response_text = crawl_result.text
                            else:
                                # Last resort: use Playwright extraction
                                response_text = await page.evaluate("""
                                    () => {
                                        const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
                                        if (assistantMessages.length > 0) {
                                            return assistantMessages[assistantMessages.length - 1].textContent;
                                        }
                                        return document.body.textContent;
                                    }
                                """)
                        
                        print(f"Extracted {len(response_text)} characters using crawl4ai")
                        
                    except Exception as e:
                        print(f"Error with crawl4ai extraction: {e}")
                        # Fallback to Playwright extraction
                        response_text = await page.evaluate("""
                            () => {
                                const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
                                if (assistantMessages.length > 0) {
                                    return assistantMessages[assistantMessages.length - 1].textContent;
                                }
                                return document.body.textContent;
                            }
                        """)
                        crawl_result = None
                        print(f"Fallback: extracted {len(response_text)} characters using Playwright")
                    
                    finally:
                        # Clean up temporary file
                        if os.path.exists(temp_html_path):
                            os.remove(temp_html_path)
                            
            except Exception as e:
                print(f"crawl4ai initialization failed: {e}")
                # Complete fallback - use Playwright extraction
                response_text = await page.evaluate("""
                    () => {
                        const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
                        if (assistantMessages.length > 0) {
                            return assistantMessages[assistantMessages.length - 1].textContent;
                        }
                        return document.body.textContent;
                    }
                """)
                crawl_result = None
                print(f"Complete fallback: extracted {len(response_text)} characters using Playwright")
            
            # STEP 2: Create markdown content and upload to S3 (for debugging/readability)
            markdown_content = f"""# ChatGPT Response

**Query:** {query}
**Timestamp:** {datetime.now().isoformat()}

## Response Content

{response_text}

## Raw HTML

The full HTML content is available in the corresponding HTML file.
"""
            
            print("Uploading markdown content to S3...")
            md_s3_key = upload_markdown_to_s3(markdown_content, S3_BUCKET, S3_PATH, timestamp)
            
            print("\n" + "="*50)
            print("PROCESSING RESPONSE...")
            print("="*50)
            
            # STEP 3: Use Gemini to format content from HTML (not markdown)
            print("\n" + "="*50)
            print("FORMATTING WITH GEMINI FROM HTML...")
            print("="*50)
            
            formatted_content = {}
            if response_text:
                # Gemini processes the response_text (extracted from HTML by crawl4ai)
                formatted_content = format_with_gemini(response_text, query, crawl_result)
                print(" Successfully formatted with Gemini")
                
                # Print detailed formatting results
                if formatted_content.get("tables"):
                    print(f" Extracted {len(formatted_content['tables'])} table(s)")
                    for i, table in enumerate(formatted_content["tables"]):
                        print(f"   Table {i+1}: {len(table.get('rows', []))} rows")
                
                if formatted_content.get("links"):
                    print(f"🔗 Found {len(formatted_content['links'])} link(s)")
                
                if formatted_content.get("citations"):
                    print(f"Found {len(formatted_content['citations'])} citation(s)")
                
                if formatted_content.get("citation_links"):
                    print(f"🔗 Found {len(formatted_content['citation_links'])} citation link(s)")
            else:
                print(" No response text to format")
            
            # Clean the raw response text to separate citations
            cleaned_response_text = clean_raw_response_text(response_text) if response_text else ""
            
            # Create enhanced response data
            response_data = {
                "url": page.url,
                "title": "ChatGPT Response",
                "scraped_at": datetime.now().isoformat(),
                "query": query,
                "status": "success" if response_text else "failed",
                "raw_response": cleaned_response_text,
                "formatted_content": formatted_content,
                "metadata": {
                    "total_tables": len(formatted_content.get("tables", [])),
                    "total_links": len(formatted_content.get("links", [])),
                    "total_citations": len(formatted_content.get("citations", [])),
                    "total_lists": len(formatted_content.get("lists", [])),
                    "total_headings": len(formatted_content.get("headings", [])),
                    "formatted_by": "gemini-api",
                    "processing_method": "crawl4ai_extraction"
                }
            }
            
            # STEP 4: Upload final processed result to S3
            print("\n" + "="*50)
            print("UPLOADING FINAL RESULT TO S3...")
            print("="*50)

            # Upload final JSON result to results/ subdirectory
            final_s3_key = upload_to_s3(response_data, S3_BUCKET, S3_PATH)
            
            if final_s3_key:
                print(f"\nFinal result saved to S3: s3://{S3_BUCKET}/{final_s3_key}")
                response_data['final_s3_key'] = final_s3_key
            else:
                print("\nFailed to upload final result to S3")
            
            # Print the extracted response
            print("\n" + "="*50)
            print("CHATGPT RESPONSE:")
            print("="*50)
            if response_text:
                print(response_text)
            else:
                print("Could not extract response content. The page structure might have changed.")
            print("="*50)
            
            # Print structured content summary
            if formatted_content:
                print("\n" + "="*50)
                print("GEMINI-FORMATTED CONTENT SUMMARY:")
                print("="*50)
                print(f"Tables: {len(formatted_content.get('tables', []))}")
                if formatted_content.get('tables'):
                    for i, table in enumerate(formatted_content['tables']):
                        print(f"  Table {i+1}: '{table.get('title', 'Untitled')}' - {len(table.get('rows', []))} rows")
                
                print(f"Links: {len(formatted_content.get('links', []))}")
                if formatted_content.get('links'):
                    for link in formatted_content['links']:
                        print(f"  - {link}")
                
                print(f"Citations: {len(formatted_content.get('citations', []))}")
                if formatted_content.get('citations'):
                    for citation in formatted_content['citations']:  
                        citation_link = formatted_content.get('citation_links', {}).get(citation, 'No link found')
                        print(f"  - {citation}: {citation_link}")
                
                if formatted_content.get('citation_links') and not formatted_content.get('citations'):
                    print("Citation Links:")
                    for citation, link in list(formatted_content['citation_links'].items()):
                        print(f"  - {citation}: {link}")
                
                print(f"Content Length: {len(formatted_content.get('content', ''))}")
                print("="*50)
            

            
            return response_data
            
        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path='/tmp/error_screenshot.png')
            print("Screenshot saved as error_screenshot.png for debugging")
            return None
        
        finally:
            # Close browser
            await browser.close()

async def wait_for_response_with_error_handling(page):
    """Wait for response while handling errors"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Wait for either response or specific error messages
            await page.wait_for_selector(
                '[data-testid="conversation-turn-2"] .markdown, [class*="error"], [data-testid="error-message"]',
                timeout=30000
            )
            
            # Check for specific error messages only
            error_selectors = [
                'div:has-text("Something went wrong")',
                'div:has-text("Error occurred")',
                'div:has-text("Failed to generate")',
                '[data-testid="error-message"]',
                '.error-message'
            ]
            
            error_found = False
            for error_selector in error_selectors:
                error_element = await page.query_selector(error_selector)
                if error_element:
                    error_text = await error_element.text_content()
                    # Only treat as error if it contains specific error keywords
                    if any(keyword in error_text.lower() for keyword in ['error', 'went wrong', 'failed', 'something went wrong']):
                        print(f" ChatGPT Error: {error_text}")
                        error_found = True
                        
                        # Click retry button if available
                        retry_button = await page.query_selector('button:has-text("Retry")')
                        if retry_button:
                            print(" Clicking retry button...")
                            await retry_button.click()
                            await asyncio.sleep(5)
                            continue
                        else:
                            return None
            
            if not error_found:
                print("✅ No errors detected, response should be available")
                return True
            
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(10)
                continue
            else:
                return None

async def handle_cookie_consent(page):
    """Handle cookie consent banner"""
    try:
        # Look for cookie consent buttons
        cookie_selectors = [
            'button:has-text("Accept all")',
            'button:has-text("Accept")',
            '[data-testid="cookie-accept"]',
            'button:has-text("OK")'
        ]
        
        for selector in cookie_selectors:
            cookie_button = await page.query_selector(selector)
            if cookie_button:
                print("Accepting cookies...")
                await cookie_button.click()
                await asyncio.sleep(2)
                return True
        
        # Also handle cookie preferences modal
        modal_selectors = [
            '[data-testid="modal-cookie-preferences"]',
            '.modal',
            '[class*="modal"]',
            '[class*="cookie"]'
        ]
        
        for selector in modal_selectors:
            modal = await page.query_selector(selector)
            if modal:
                print("Found cookie modal, trying to close...")
                # Try to find close button in modal
                close_buttons = [
                    'button:has-text("Accept")',
                    'button:has-text("Accept all")',
                    'button:has-text("Close")',
                    'button:has-text("OK")',
                    '[data-testid="close"]',
                    '.close-button'
                ]
                
                for close_selector in close_buttons:
                    close_btn = await modal.query_selector(close_selector)
                    if close_btn:
                        print("Closing cookie modal...")
                        await close_btn.click()
                        await asyncio.sleep(2)
                        return True
                
                # If no close button found, try clicking outside or pressing Escape
                try:
                    await page.keyboard.press('Escape')
                    await asyncio.sleep(1)
                    return True
                except:
                    pass
        
        return False
    except Exception as e:
        print(f"Cookie handling error: {e}")
        return False

# Run the automation
if __name__ == "__main__":
    print("Starting ChatGPT automation with enhanced Gemini formatting and crawl4ai...")
    print("Make sure you have installed the required packages:")
    print("pip install playwright playwright-stealth crawl4ai google-generativeai boto3")
    print("playwright install chromium")
    print()
    
    asyncio.run(automate_chatgpt())

def lambda_handler(event, context):
    """
    AWS Lambda handler function
    """
    try:
        # Parse the event to get the query
        query = event.get('query')
        
        if not query:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Query is required in the event'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        print(f"Starting ChatGPT automation with query: {query}")
        
    
        result = asyncio.run(automate_chatgpt(query))
        
        if result:
            return {
                'statusCode': 200,
                'body': json.dumps(result, default=str),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to process request'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
    except Exception as e:
        print(f"Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
