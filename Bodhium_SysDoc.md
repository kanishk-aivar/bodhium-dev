# Bodhium System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Data Flow](#data-flow)
5. [API Reference](#api-reference)
6. [Deployment Guide](#deployment-guide)
7. [Configuration](#configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

## System Overview

Bodhium is a comprehensive AI-powered web scraping and analysis platform that combines web crawling, intelligent query generation, and multi-LLM orchestration to provide deep insights into products and market data.

### Key Features
- **Intelligent Web Scraping**: AI-powered product extraction using Google Gemini
- **Dynamic Query Generation**: Automated generation of product and market-specific queries
- **Multi-LLM Orchestration**: Parallel processing across 4 different LLM providers
- **Structured Data Storage**: Comprehensive data storage in S3 and RDS
- **Real-time Processing**: Event-driven architecture with DynamoDB logging
- **Modern UI**: React-based user interface with real-time streaming

### System Components
1. **Web Scraper**: Crawls e-commerce websites and extracts product data
2. **Query Generator**: Creates intelligent queries based on scraped products
3. **LLM Orchestrator**: Manages parallel LLM processing
4. **LLM Providers**: 4 different AI services for comprehensive analysis
5. **Frontend UI**: React application for user interaction
6. **Data Storage**: S3, RDS, and DynamoDB for comprehensive data management

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│   API Gateway   │───▶│   Web Scraper   │
│   (React)       │    │                 │    │   (AWS Batch)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Query Gen.    │◀───│   S3 Storage    │◀───│   RDS Database  │
│   (Lambda)      │    │   (Results)     │    │   (Products)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LLM Orchestr. │───▶│   LLM Providers │───▶│   DynamoDB      │
│   (Lambda)      │    │   (4 Services)  │    │   (Logging)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Detailed Component Architecture

#### 1. Web Scraper (AWS Batch)
- **Technology**: Python with Docker containerization
- **AI Engine**: Google Gemini 1.5 Flash for product extraction
- **Storage**: S3 (CSV, JSON, Markdown, screenshots) + RDS (structured data)
- **Discovery**: Sitemap, Common Crawl, and manual URL discovery
- **Output Formats**: Multiple formats for different use cases

#### 2. Query Generator (Lambda)
- **Technology**: Python with psycopg3 for RDS connectivity
- **AI Engine**: Google Gemini for intelligent query generation
- **Query Types**: Product-specific and market-specific queries
- **Batch Processing**: Handles multiple products simultaneously
- **Storage**: S3 + RDS with comprehensive logging

#### 3. LLM Orchestrator (Lambda)
- **Technology**: Python with async processing
- **Orchestration**: Fan-out pattern to 4 LLM providers
- **Load Balancing**: Distributes queries across providers
- **Result Aggregation**: Combines results from all providers
- **Error Handling**: Comprehensive error handling and retry logic

#### 4. LLM Providers
- **AI Mode**: Uses ScrapingDog API for web scraping
- **AI Overview**: Direct API integration with AI Overview service
- **ChatGPT**: Playwright automation with crawl4ai extraction
- **Perplexity**: Direct API integration with Perplexity service

#### 5. Frontend UI (React)
- **Technology**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: React hooks with streaming support
- **Real-time Updates**: WebSocket-like streaming for results

## Components

### 1. Web Scraper Component

#### Purpose
The Web Scraper is responsible for crawling e-commerce websites, extracting product information using AI, and storing the results in both S3 and RDS.

#### Key Features
- **Intelligent URL Discovery**: Automatically discovers URLs using sitemaps, Common Crawl, and manual fallback
- **AI-Powered Product Extraction**: Uses Google Gemini 1.5 Flash to extract structured product data
- **Comprehensive Data Storage**: Saves results to S3 (CSV, JSON, Markdown, screenshots) and RDS
- **Cost Optimization**: Implements tiered pricing for token usage tracking
- **Robust Error Handling**: Graceful failure handling with detailed logging

#### Configuration
```python
# Environment Variables
S3_BUCKET_NAME=your-crawl-results-bucket
DYNAMODB_TABLE_NAME=OrchestrationLogs
GEMINI_SECRET_NAME=Gemini-API-ChatGPT
AWS_REGION=us-east-1
MAX_URLS=100
PAGE_TIMEOUT=60000
```

#### Output Structure
```
S3 Bucket Organization:
your-crawl-results-bucket/
├── crawl-data/
│   └── example.com/
│       └── 2024-01-15_14-30-25/
│           ├── markdown/
│           │   ├── index.md
│           │   └── products.md
│           ├── images/
│           │   ├── index.png
│           │   └── products.png
│           ├── csv/
│           │   ├── example.com_all_products.csv
│           │   └── example.com_unique_products.csv
│           ├── json/
│           │   └── example.com_crawl_results.json
│           └── tree.md
```

### 2. Query Generator Component

#### Purpose
The Query Generator creates intelligent, product-specific and market-specific queries based on the scraped product data.

#### Key Features
- **AI-Powered Generation**: Uses Google Gemini to generate contextual queries
- **Dual Query Types**: Product-specific and market-specific questions
- **Database Integration**: Stores queries in RDS with product associations
- **Batch Processing**: Handles multiple products efficiently
- **Comprehensive Logging**: Detailed execution tracking

#### Query Generation Process
1. **Product Processing**: Extracts product information from RDS
2. **AI Analysis**: Uses Gemini to analyze product characteristics
3. **Query Creation**: Generates 25 product-specific and 25 market-specific queries
4. **Database Storage**: Stores queries with product associations
5. **S3 Backup**: Saves results to S3 for redundancy

#### Example Queries Generated
**Product-Specific:**
- "What are the key features of [Product Name]?"
- "How does [Product Name] compare to similar products?"
- "What are the pros and cons of [Product Name]?"

**Market-Specific:**
- "What is the market position of [Product Name]?"
- "How popular is [Product Name] in the current market?"
- "What are the current trends affecting [Product Name]?"

### 3. LLM Orchestrator Component

#### Purpose
The LLM Orchestrator manages the parallel processing of queries across multiple LLM providers, ensuring comprehensive analysis and result aggregation.

#### Key Features
- **Parallel Processing**: Fan-out pattern to 4 LLM providers
- **Load Balancing**: Distributes queries efficiently across providers
- **Result Aggregation**: Combines and normalizes results from all providers
- **Error Handling**: Comprehensive error handling with retry logic
- **Performance Monitoring**: Tracks execution times and success rates

#### Orchestration Flow
1. **Query Distribution**: Distributes queries to all 4 LLM providers
2. **Parallel Execution**: All providers process queries simultaneously
3. **Result Collection**: Collects results from all providers
4. **Data Normalization**: Standardizes result formats
5. **Storage**: Saves results to S3 and RDS
6. **Logging**: Records all orchestration events in DynamoDB

### 4. LLM Provider Components

#### AI Mode (ScrapingDog)
- **Technology**: Direct API integration with ScrapingDog
- **Use Case**: Web scraping and data extraction
- **Strengths**: Real-time web data access
- **Configuration**: API key management through AWS Secrets Manager

#### AI Overview
- **Technology**: Direct API integration
- **Use Case**: Market analysis and overview generation
- **Strengths**: Comprehensive market insights
- **Configuration**: API key management through AWS Secrets Manager

#### ChatGPT (Playwright + crawl4ai)
- **Technology**: Playwright automation with crawl4ai extraction
- **Use Case**: Conversational AI responses
- **Strengths**: Natural language processing
- **Configuration**: Browser automation with stealth mode

#### Perplexity
- **Technology**: Direct API integration
- **Use Case**: Research and information synthesis
- **Strengths**: Research capabilities and citations
- **Configuration**: API key management through AWS Secrets Manager

### 5. Frontend UI Component

#### Purpose
The Frontend UI provides a modern, interactive interface for users to interact with the Bodhium system.

#### Key Features
- **Modern Design**: Clean, responsive interface using shadcn/ui
- **Real-time Streaming**: Live updates as results are processed
- **Query Management**: Add, remove, and customize queries
- **Result Visualization**: Rich display of LLM responses
- **Mobile Responsive**: Works seamlessly across devices

#### UI Components
- **Query Selection**: Interface for selecting and customizing queries
- **LLM Selector**: Choose which LLM providers to use
- **Results Display**: Rich visualization of LLM responses
- **Loading Indicators**: Real-time progress tracking
- **Error Handling**: User-friendly error messages

## Data Flow

### Complete System Flow

#### 1. URL Input Phase
```
User Input (URL) → API Gateway → Web Scraper Lambda → AWS Batch Job
```

#### 2. Web Scraping Phase
```
AWS Batch Job → URL Discovery → Content Crawling → AI Extraction → S3/RDS Storage
```

#### 3. Query Generation Phase
```
RDS Product Data → Query Generator Lambda → AI Query Creation → RDS/S3 Storage
```

#### 4. LLM Processing Phase
```
Query Data → LLM Orchestrator → Fan-out to 4 LLM Providers → Result Aggregation
```

#### 5. Result Storage Phase
```
Aggregated Results → S3 Storage → RDS Storage → DynamoDB Logging
```

#### 6. Frontend Display Phase
```
S3 Results → API Gateway → Frontend UI → Real-time Display
```

### Detailed Data Flow

#### Step 1: URL Processing
1. User submits URL through frontend or API
2. API Gateway receives request
3. Web Scraper Lambda triggers AWS Batch job
4. Batch job initializes with URL parameter

#### Step 2: Web Scraping
1. **URL Discovery**: 
   - Sitemap analysis
   - Common Crawl integration
   - Manual URL patterns
2. **Content Crawling**:
   - Page content extraction
   - Screenshot capture
   - Link discovery
3. **AI Extraction**:
   - Google Gemini analysis
   - Product data extraction
   - Structured data creation
4. **Storage**:
   - S3: Raw data, screenshots, JSON
   - RDS: Structured product data

#### Step 3: Query Generation
1. **Product Retrieval**: Extract products from RDS
2. **AI Analysis**: Gemini analyzes each product
3. **Query Creation**: Generate 50 queries per product (25 product + 25 market)
4. **Database Storage**: Store queries with product associations
5. **S3 Backup**: Save query data to S3

#### Step 4: LLM Orchestration
1. **Query Distribution**: Send queries to all 4 LLM providers
2. **Parallel Processing**: All providers process simultaneously
3. **Result Collection**: Gather results from all providers
4. **Data Normalization**: Standardize result formats
5. **Storage**: Save to S3 and RDS
6. **Logging**: Record events in DynamoDB

#### Step 5: Result Processing
1. **Aggregation**: Combine results from all providers
2. **Formatting**: Standardize output format
3. **Storage**: Save to S3 and RDS
4. **Notification**: Update frontend with results

## API Reference

### Web Scraper API

#### Submit Scraping Job
```http
POST /scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "max_urls": 100,
  "timeout": 60000
}
```

#### Response
```json
{
  "job_id": "uuid-string",
  "status": "submitted",
  "estimated_duration": "5-10 minutes"
}
```

### Query Generator API

#### Generate Queries
```http
POST /generate-queries
Content-Type: application/json

{
  "products": [
    {
      "name": "Product Name",
      "brand": "Brand Name",
      "description": "Product description"
    }
  ],
  "num_questions": 25
}
```

#### Response
```json
{
  "success": true,
  "job_id": "uuid-string",
  "data": [
    {
      "product": {...},
      "product_id": 123,
      "product_questions": [...],
      "market_questions": [...]
    }
  ],
  "total_queries_generated": 50
}
```

### LLM Orchestrator API

#### Process Queries
```http
POST /process-queries
Content-Type: application/json

{
  "queries": [
    {
      "query_id": 123,
      "query_text": "What are the features of Product X?",
      "product_id": 456
    }
  ],
  "llm_providers": ["ai_mode", "ai_overview", "chatgpt", "perplexity"]
}
```

#### Response
```json
{
  "job_id": "uuid-string",
  "status": "processing",
  "estimated_completion": "2-3 minutes",
  "providers": {
    "ai_mode": "processing",
    "ai_overview": "processing",
    "chatgpt": "processing",
    "perplexity": "processing"
  }
}
```

## Deployment Guide

### Prerequisites
- AWS Account with appropriate permissions
- Docker installed for local development
- Node.js and npm for frontend development
- Python 3.9+ for backend development

### AWS Services Setup

#### 1. S3 Bucket Creation
```bash
aws s3 mb s3://bodhium-data
aws s3 mb s3://bodhium-results
aws s3 mb s3://bodhium-logs
```

#### 2. DynamoDB Table Creation
```bash
aws dynamodb create-table \
    --table-name OrchestrationLogs \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
```

#### 3. RDS Database Setup
```bash
# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier bodhium-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username admin \
    --master-user-password your-password \
    --allocated-storage 20
```

#### 4. Secrets Manager Setup
```bash
# Store API keys
aws secretsmanager create-secret \
    --name "Gemini-API-ChatGPT" \
    --secret-string '{"GEMINI_API_KEY":"your-gemini-key"}'

aws secretsmanager create-secret \
    --name "dev/rds" \
    --secret-string '{"DB_HOST":"your-rds-endpoint","DB_PORT":5432,"DB_NAME":"bodhium","DB_USER":"admin","DB_PASSWORD":"your-password"}'
```

### Lambda Deployment

#### 1. Web Scraper Lambda
```bash
# Create deployment package
cd Web\ Scrapper/
zip -r web-scraper.zip .

# Deploy to Lambda
aws lambda create-function \
    --function-name bodhium-web-scraper \
    --runtime python3.9 \
    --role arn:aws:iam::account:role/lambda-execution-role \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://web-scraper.zip
```

#### 2. Query Generator Lambda
```bash
# Create deployment package
cd Query\ Generator/
zip -r query-generator.zip .

# Deploy to Lambda
aws lambda create-function \
    --function-name bodhium-query-generator \
    --runtime python3.9 \
    --role arn:aws:iam::account:role/lambda-execution-role \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://query-generator.zip
```

#### 3. LLM Orchestrator Lambda
```bash
# Create deployment package
cd LLM\ Orchestrator/
zip -r llm-orchestrator.zip .

# Deploy to Lambda
aws lambda create-function \
    --function-name bodhium-llm-orchestrator \
    --runtime python3.9 \
    --role arn:aws:iam::account:role/lambda-execution-role \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://llm-orchestrator.zip
```

### Frontend Deployment

#### 1. Build Frontend
```bash
cd Sample_UI/Bodhium-UI/
npm install
npm run build
```

#### 2. Deploy to S3
```bash
aws s3 sync dist/ s3://bodhium-frontend --delete
aws s3 website s3://bodhium-frontend --index-document index.html
```

### API Gateway Setup

#### 1. Create API
```bash
aws apigateway create-rest-api \
    --name bodhium-api \
    --description "Bodhium API Gateway"
```

#### 2. Create Resources and Methods
```bash
# Create resources for each endpoint
aws apigateway create-resource \
    --rest-api-id your-api-id \
    --parent-id your-parent-id \
    --path-part "scrape"

# Create POST method
aws apigateway put-method \
    --rest-api-id your-api-id \
    --resource-id your-resource-id \
    --http-method POST \
    --authorization-type NONE
```

## Configuration

### Environment Variables

#### Web Scraper
```bash
S3_BUCKET_NAME=bodhium-data
DYNAMODB_TABLE_NAME=OrchestrationLogs
GEMINI_SECRET_NAME=Gemini-API-ChatGPT
AWS_REGION=us-east-1
MAX_URLS=100
PAGE_TIMEOUT=60000
LOG_LEVEL=INFO
```

#### Query Generator
```bash
S3_BUCKET=bodhium-query
ORCHESTRATION_LOGS_TABLE=OrchestrationLogs
SECRET_NAME=Gemini-API-ChatGPT
RDS_SECRET=dev/rds
SECRET_REGION=us-east-1
```

#### LLM Orchestrator
```bash
S3_BUCKET=bodhium-results
DYNAMODB_TABLE=OrchestrationLogs
SECRET_REGION=us-east-1
```

### Database Schema

#### Products Table
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_data JSONB NOT NULL,
    brand_name VARCHAR(255),
    product_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Queries Table
```sql
CREATE TABLE queries (
    query_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Results Table
```sql
CREATE TABLE results (
    result_id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES queries(query_id),
    llm_provider VARCHAR(50),
    response_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring & Logging

### DynamoDB Logging Structure

#### Event Types
- `WebScrapingJobStarted`
- `WebScrapingJobCompleted`
- `WebScrapingJobFailed`
- `QueryGenerationLambdaStarted`
- `QueryGenerationLambdaCompleted`
- `QueryGenerationLambdaFailed`
- `LLMOrchestrationStarted`
- `LLMOrchestrationCompleted`
- `LLMOrchestrationFailed`

#### Log Entry Structure
```json
{
  "pk": "job-id",
  "sk": "timestamp#event-id",
  "job_id": "job-id",
  "event_timestamp_id": "timestamp#event-id",
  "eventName": "EventType",
  "details": {
    "execution_time": 123.45,
    "products_processed": 10,
    "queries_generated": 500,
    "s3_output_path": "s3://bucket/path"
  }
}
```

### CloudWatch Monitoring

#### Key Metrics
- Lambda execution duration
- Lambda error rates
- S3 object counts and sizes
- DynamoDB read/write capacity
- API Gateway request counts

#### Alarms
- Lambda function errors > 5%
- Lambda duration > 5 minutes
- S3 bucket size > 1GB
- DynamoDB throttling events

### Performance Monitoring

#### Web Scraper Metrics
- URLs discovered per job
- Pages crawled successfully
- AI extraction accuracy
- Token usage and costs
- Processing time per URL

#### Query Generator Metrics
- Queries generated per product
- AI generation time
- Database insertion success rate
- S3 upload success rate

#### LLM Orchestrator Metrics
- Queries processed per provider
- Provider response times
- Success rates per provider
- Result aggregation time

## Troubleshooting

### Common Issues

#### 1. Web Scraper Failures
**Issue**: Docker build failures
**Solution**: 
- Ensure sufficient disk space
- Check internet connectivity
- Verify Docker daemon is running

**Issue**: AWS Batch job failures
**Solution**:
- Check IAM permissions
- Verify ECR image exists
- Review CloudWatch logs

#### 2. Query Generator Issues
**Issue**: Database connection failures
**Solution**:
- Verify RDS endpoint and credentials
- Check VPC and security group settings
- Ensure Lambda has proper IAM permissions

**Issue**: Gemini API errors
**Solution**:
- Verify API key in Secrets Manager
- Check API rate limits
- Monitor token usage

#### 3. LLM Orchestrator Issues
**Issue**: Provider timeouts
**Solution**:
- Increase Lambda timeout settings
- Implement retry logic
- Monitor provider API limits

**Issue**: Result aggregation failures
**Solution**:
- Check S3 permissions
- Verify result format consistency
- Monitor DynamoDB capacity

#### 4. Frontend Issues
**Issue**: Real-time updates not working
**Solution**:
- Check WebSocket connections
- Verify API Gateway CORS settings
- Monitor network connectivity

### Debug Mode

Enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

### Error Recovery

#### Automatic Recovery
- Lambda retries with exponential backoff
- S3 multipart upload for large files
- DynamoDB conditional writes for consistency

#### Manual Recovery
- Check CloudWatch logs for detailed error information
- Review DynamoDB logs for orchestration events
- Verify S3 bucket contents and permissions

### Performance Optimization

#### Lambda Optimization
- Use provisioned concurrency for consistent performance
- Implement connection pooling for database connections
- Use lazy loading for heavy dependencies

#### S3 Optimization
- Implement multipart uploads for large files
- Use S3 Transfer Acceleration for faster uploads
- Implement lifecycle policies for cost optimization

#### Database Optimization
- Use connection pooling
- Implement query optimization
- Monitor and adjust capacity as needed

---

## Conclusion

The Bodhium system provides a comprehensive solution for AI-powered web scraping and analysis. With its modular architecture, robust error handling, and scalable design, it can handle large-scale data processing while maintaining high reliability and performance.

For additional support or questions, please refer to the troubleshooting section or contact the development team. 