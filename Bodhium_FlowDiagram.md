# Bodhium System Flow Diagram

## Complete System Flow

```mermaid
graph TD
    %% User Interface Layer
    A[User Input: URL] --> B[Frontend UI - React]
    B --> C[API Gateway]
    
    %% Web Scraping Phase
    C --> D[Web Scraper Lambda]
    D --> E[AWS Batch Job]
    E --> F[URL Discovery]
    F --> G[Content Crawling]
    G --> H[AI Extraction - Gemini]
    H --> I[S3 Storage - Raw Data]
    H --> J[RDS Storage - Products]
    
    %% Query Generation Phase
    J --> K[Query Generator Lambda]
    K --> L[Product Analysis - Gemini]
    L --> M[Generate 25 Product Queries]
    L --> N[Generate 25 Market Queries]
    M --> O[RDS Storage - Queries]
    N --> O
    O --> P[S3 Storage - Query Data]
    
    %% LLM Orchestration Phase
    O --> Q[LLM Orchestrator Lambda]
    Q --> R[Fan-out to 4 LLM Providers]
    
    %% LLM Providers
    R --> S[AI Mode - ScrapingDog]
    R --> T[AI Overview - API]
    R --> U[ChatGPT - Playwright + crawl4ai]
    R --> V[Perplexity - API]
    
    %% Result Processing
    S --> W[Result Aggregation]
    T --> W
    U --> W
    V --> W
    
    %% Storage and Logging
    W --> X[S3 Storage - Results]
    W --> Y[RDS Storage - Results]
    W --> Z[DynamoDB - Logging]
    
    %% Frontend Display
    X --> AA[API Gateway]
    Y --> AA
    AA --> BB[Frontend UI - Real-time Display]
    
    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef awsService fill:#fff3e0
    classDef lambda fill:#f3e5f5
    classDef storage fill:#e8f5e8
    classDef llm fill:#fff8e1
    classDef api fill:#fce4ec
    
    class A,B,BB userLayer
    class C,E,I,P,X,Y,Z awsService
    class D,K,Q lambda
    class J,O storage
    class S,T,U,V llm
    class H,L api
```

## Detailed Component Flow

### 1. URL Input and Web Scraping Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend UI
    participant AG as API Gateway
    participant WS as Web Scraper Lambda
    participant AB as AWS Batch
    participant S3 as S3 Storage
    participant RDS as RDS Database
    participant DDB as DynamoDB
    
    U->>F: Submit URL
    F->>AG: POST /scrape {url: "example.com"}
    AG->>WS: Invoke Lambda
    WS->>AB: Submit Batch Job
    AB->>AB: URL Discovery (Sitemap, Common Crawl)
    AB->>AB: Content Crawling (Playwright)
    AB->>AB: AI Extraction (Gemini)
    AB->>S3: Save Raw Data (CSV, JSON, Screenshots)
    AB->>RDS: Save Structured Products
    AB->>DDB: Log Completion Event
    AB->>WS: Job Complete
    WS->>AG: Return Job ID
    AG->>F: Success Response
    F->>U: Display Job Status
```

### 2. Query Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend UI
    participant AG as API Gateway
    participant QG as Query Generator Lambda
    participant RDS as RDS Database
    participant S3 as S3 Storage
    participant DDB as DynamoDB
    participant G as Gemini AI
    
    U->>F: Select Products for Query Generation
    F->>AG: POST /generate-queries {products: [...]}
    AG->>QG: Invoke Lambda
    QG->>RDS: Fetch Product Data
    QG->>G: Analyze Products
    G->>QG: Product Analysis Results
    QG->>QG: Generate 25 Product Queries
    QG->>QG: Generate 25 Market Queries
    QG->>RDS: Store Queries with Product Associations
    QG->>S3: Save Query Data Backup
    QG->>DDB: Log Generation Event
    QG->>AG: Return Query IDs
    AG->>F: Success Response
    F->>U: Display Generated Queries
```

### 3. LLM Orchestration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend UI
    participant AG as API Gateway
    participant LO as LLM Orchestrator Lambda
    participant AM as AI Mode (ScrapingDog)
    participant AO as AI Overview
    participant CG as ChatGPT (Playwright)
    participant PX as Perplexity
    participant S3 as S3 Storage
    participant RDS as RDS Database
    participant DDB as DynamoDB
    
    U->>F: Select Queries & LLM Providers
    F->>AG: POST /process-queries {queries: [...], providers: [...]}
    AG->>LO: Invoke Lambda
    LO->>DDB: Log Orchestration Start
    
    par Parallel Processing
        LO->>AM: Process Queries
        LO->>AO: Process Queries
        LO->>CG: Process Queries
        LO->>PX: Process Queries
    end
    
    AM->>LO: Return Results
    AO->>LO: Return Results
    CG->>LO: Return Results
    PX->>LO: Return Results
    
    LO->>LO: Aggregate & Normalize Results
    LO->>S3: Save Final Results
    LO->>RDS: Store Results
    LO->>DDB: Log Completion
    LO->>AG: Return Job Status
    AG->>F: Success Response
    F->>U: Display Results
```

## Data Storage Flow

```mermaid
graph LR
    %% Input Data
    A[URL Input] --> B[Web Scraper]
    
    %% S3 Storage Structure
    B --> C[S3 Bucket: bodhium-data]
    C --> D[crawl-data/]
    D --> E[domain.com/]
    E --> F[timestamp/]
    F --> G[markdown/]
    F --> H[images/]
    F --> I[csv/]
    F --> J[json/]
    
    %% RDS Storage Structure
    B --> K[RDS Database]
    K --> L[products table]
    K --> M[queries table]
    K --> N[results table]
    
    %% DynamoDB Logging
    B --> O[DynamoDB: OrchestrationLogs]
    O --> P[Job Events]
    O --> Q[Error Logs]
    O --> R[Performance Metrics]
    
    %% Styling
    classDef storage fill:#e8f5e8
    classDef data fill:#fff3e0
    classDef log fill:#fce4ec
    
    class C,D,E,F,G,H,I,J storage
    class K,L,M,N data
    class O,P,Q,R log
```

## Error Handling Flow

```mermaid
graph TD
    A[Process Start] --> B{Check Input}
    B -->|Valid| C[Execute Process]
    B -->|Invalid| D[Return Error Response]
    
    C --> E{Process Success?}
    E -->|Yes| F[Store Results]
    E -->|No| G[Error Handler]
    
    G --> H{Retryable Error?}
    H -->|Yes| I[Retry Logic]
    H -->|No| J[Log Error & Stop]
    
    I --> K{Max Retries?}
    K -->|No| C
    K -->|Yes| L[Fallback Process]
    
    L --> M{Fallback Success?}
    M -->|Yes| F
    M -->|No| J
    
    F --> N[Log Success]
    N --> O[Return Results]
    
    D --> P[Log Error]
    J --> P
    P --> Q[Notify User]
    
    %% Styling
    classDef success fill:#e8f5e8
    classDef error fill:#ffebee
    classDef process fill:#fff3e0
    
    class F,N,O success
    class D,G,J,P,Q error
    class A,B,C,E,H,I,K,L,M process
```

## Real-time Processing Flow

```mermaid
graph TD
    A[User Action] --> B[Frontend State Update]
    B --> C[API Request]
    C --> D[Lambda Processing]
    D --> E[Database Operation]
    E --> F[Result Generation]
    F --> G[WebSocket/SSE Update]
    G --> H[Frontend Re-render]
    H --> I[User Sees Update]
    
    %% Parallel Processing
    D --> J[Background Task 1]
    D --> K[Background Task 2]
    D --> L[Background Task 3]
    D --> M[Background Task 4]
    
    J --> N[Result Aggregation]
    K --> N
    L --> N
    M --> N
    
    N --> G
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#fff3e0
    classDef realtime fill:#f3e5f5
    
    class A,B,H,I frontend
    class C,D,E,F,J,K,L,M,N backend
    class G realtime
```

## Security and Authentication Flow

```mermaid
graph TD
    A[User Request] --> B[API Gateway]
    B --> C{Authenticated?}
    C -->|No| D[Return 401]
    C -->|Yes| E[Validate Permissions]
    
    E --> F{Permission Valid?}
    F -->|No| G[Return 403]
    F -->|Yes| H[Process Request]
    
    H --> I[Secrets Manager]
    I --> J[Get API Keys]
    J --> K[Execute Lambda]
    
    K --> L[Log Access]
    L --> M[Return Response]
    
    %% Styling
    classDef auth fill:#ffebee
    classDef process fill:#e8f5e8
    classDef security fill:#fff3e0
    
    class D,G auth
    class H,K,M process
    class B,C,E,F,I,J,L security
```

## Performance Monitoring Flow

```mermaid
graph TD
    A[System Operation] --> B[CloudWatch Metrics]
    B --> C[Lambda Duration]
    B --> D[Error Rates]
    B --> E[S3 Operations]
    B --> F[DynamoDB Operations]
    
    C --> G{Threshold Exceeded?}
    D --> H{Error Rate > 5%?}
    E --> I{S3 Size > 1GB?}
    F --> J{Throttling Events?}
    
    G -->|Yes| K[CloudWatch Alarm]
    H -->|Yes| K
    I -->|Yes| K
    J -->|Yes| K
    
    K --> L[SNS Notification]
    L --> M[Email/SMS Alert]
    L --> N[Auto Scaling]
    
    %% Styling
    classDef monitor fill:#e1f5fe
    classDef alert fill:#ffebee
    classDef action fill:#e8f5e8
    
    class A,B,C,D,E,F monitor
    class G,H,I,J,K alert
    class L,M,N action
```

## Cost Optimization Flow

```mermaid
graph TD
    A[Token Usage] --> B[Gemini API]
    B --> C[Cost Calculation]
    C --> D{Standard Tier?}
    D -->|Yes| E[≤128k tokens]
    D -->|No| F[>128k tokens]
    
    E --> G[$0.075/1M input]
    F --> H[$0.15/1M input]
    
    G --> I[Cost Tracking]
    H --> I
    I --> J[Budget Alert]
    
    J --> K{Budget Exceeded?}
    K -->|Yes| L[Throttle Requests]
    K -->|No| M[Continue Processing]
    
    %% Styling
    classDef cost fill:#fff3e0
    classDef alert fill:#ffebee
    classDef action fill:#e8f5e8
    
    class A,B,C,D,E,F,G,H,I cost
    class J,K alert
    class L,M action
```

## Complete End-to-End Flow Summary

### Phase 1: URL Processing (5-10 minutes)
1. **User Input**: URL submitted through frontend or API
2. **Web Scraping**: AWS Batch job crawls website and extracts products
3. **AI Processing**: Google Gemini analyzes and structures product data
4. **Storage**: Results saved to S3 and RDS

### Phase 2: Query Generation (2-3 minutes)
1. **Product Analysis**: Query Generator analyzes scraped products
2. **AI Generation**: Gemini creates 50 queries per product (25 product + 25 market)
3. **Database Storage**: Queries stored in RDS with product associations
4. **S3 Backup**: Query data backed up to S3

### Phase 3: LLM Processing (2-3 minutes)
1. **Orchestration**: LLM Orchestrator distributes queries to 4 providers
2. **Parallel Processing**: All providers process queries simultaneously
3. **Result Aggregation**: Results combined and normalized
4. **Storage**: Final results saved to S3 and RDS

### Phase 4: Result Display (Real-time)
1. **Frontend Updates**: Real-time streaming of results to UI
2. **User Interaction**: Users can view, filter, and export results
3. **Logging**: All events logged to DynamoDB for monitoring

### Key Performance Indicators
- **Total Processing Time**: 9-16 minutes end-to-end
- **Parallel Processing**: 4 LLM providers working simultaneously
- **Data Storage**: Comprehensive storage in S3, RDS, and DynamoDB
- **Real-time Updates**: Live streaming of results to frontend
- **Error Handling**: Robust error handling with retry logic
- **Cost Optimization**: Tiered pricing and budget monitoring 