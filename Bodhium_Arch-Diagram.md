# Bodhium System Architecture Diagram

## High-Level System Architecture

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend Layer"
        UI[Frontend UI - React + TypeScript]
        UI --> |HTTP/WebSocket| AG
    end
    
    %% API Gateway Layer
    subgraph "API Gateway Layer"
        AG[API Gateway]
        AG --> |Invoke| WS
        AG --> |Invoke| QG
        AG --> |Invoke| LO
    end
    
    %% Lambda Functions Layer
    subgraph "Lambda Functions"
        WS[Web Scraper Lambda]
        QG[Query Generator Lambda]
        LO[LLM Orchestrator Lambda]
    end
    
    %% AWS Services Layer
    subgraph "AWS Services"
        AB[AWS Batch]
        S3[S3 Storage]
        RDS[RDS PostgreSQL]
        DDB[DynamoDB]
        SM[Secrets Manager]
        CW[CloudWatch]
    end
    
    %% LLM Providers Layer
    subgraph "LLM Providers"
        AM[AI Mode - ScrapingDog]
        AO[AI Overview - API]
        CG[ChatGPT - Playwright]
        PX[Perplexity - API]
    end
    
    %% External Services
    subgraph "External Services"
        GEM[Google Gemini AI]
        CC[Common Crawl]
    end
    
    %% Connections
    WS --> AB
    WS --> S3
    WS --> RDS
    WS --> DDB
    WS --> SM
    WS --> GEM
    WS --> CC
    
    QG --> RDS
    QG --> S3
    QG --> DDB
    QG --> SM
    QG --> GEM
    
    LO --> AM
    LO --> AO
    LO --> CG
    LO --> PX
    LO --> S3
    LO --> RDS
    LO --> DDB
    LO --> SM
    
    %% Monitoring
    WS --> CW
    QG --> CW
    LO --> CW
    AM --> CW
    AO --> CW
    CG --> CW
    PX --> CW
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#fff3e0
    classDef lambda fill:#f3e5f5
    classDef aws fill:#e8f5e8
    classDef llm fill:#fff8e1
    classDef external fill:#fce4ec
    
    class UI frontend
    class AG api
    class WS,QG,LO lambda
    class AB,S3,RDS,DDB,SM,CW aws
    class AM,AO,CG,PX llm
    class GEM,CC external
```

## Detailed Component Architecture

### 1. Web Scraper Component Architecture

```mermaid
graph TD
    subgraph "Web Scraper Lambda"
        WS_IN[Input Handler]
        WS_VAL[Input Validation]
        WS_BATCH[Batch Job Submitter]
    end
    
    subgraph "AWS Batch Job"
        WD[URL Discovery]
        CC[Common Crawl Integration]
        SM[Sitemap Parser]
        MP[Manual Patterns]
        
        CC[Content Crawler]
        PW[Playwright Engine]
        SC[Screenshot Capture]
        LC[Link Discovery]
        
        AI[AI Extraction]
        GEM[Gemini Integration]
        PE[Product Extractor]
        SE[Structure Analyzer]
        
        ST[Storage Handler]
        S3_UPL[S3 Uploader]
        RDS_INS[RDS Inserter]
        DDB_LOG[DynamoDB Logger]
    end
    
    subgraph "External Services"
        GEM_API[Google Gemini API]
        CC_API[Common Crawl API]
    end
    
    WS_IN --> WS_VAL
    WS_VAL --> WS_BATCH
    WS_BATCH --> WD
    
    WD --> CC
    WD --> SM
    WD --> MP
    
    WD --> CC
    CC --> PW
    PW --> SC
    PW --> LC
    
    CC --> AI
    AI --> GEM
    GEM --> PE
    PE --> SE
    
    AI --> ST
    ST --> S3_UPL
    ST --> RDS_INS
    ST --> DDB_LOG
    
    GEM --> GEM_API
    CC --> CC_API
    
    %% Styling
    classDef lambda fill:#f3e5f5
    classDef batch fill:#e8f5e8
    classDef external fill:#fce4ec
    
    class WS_IN,WS_VAL,WS_BATCH lambda
    class WD,CC,SM,MP,CC,PW,SC,LC,AI,GEM,PE,SE,ST,S3_UPL,RDS_INS,DDB_LOG batch
    class GEM_API,CC_API external
```

### 2. Query Generator Component Architecture

```mermaid
graph TD
    subgraph "Query Generator Lambda"
        QG_IN[Input Handler]
        QG_VAL[Input Validation]
        QG_DB[Database Connector]
        QG_AI[AI Processor]
        QG_ST[Storage Handler]
    end
    
    subgraph "Database Operations"
        PROD_FETCH[Product Fetch]
        PROD_INS[Product Insert]
        QUERY_INS[Query Insert]
        QUERY_FETCH[Query Fetch]
    end
    
    subgraph "AI Processing"
        PROD_ANAL[Product Analysis]
        QUERY_GEN[Query Generation]
        PROD_QUERY[Product Queries]
        MARKET_QUERY[Market Queries]
    end
    
    subgraph "Storage Operations"
        S3_BACKUP[S3 Backup]
        RDS_STORE[RDS Storage]
        DDB_LOG[DynamoDB Logging]
    end
    
    QG_IN --> QG_VAL
    QG_VAL --> QG_DB
    QG_DB --> PROD_FETCH
    PROD_FETCH --> QG_AI
    QG_AI --> PROD_ANAL
    PROD_ANAL --> QUERY_GEN
    QUERY_GEN --> PROD_QUERY
    QUERY_GEN --> MARKET_QUERY
    PROD_QUERY --> QG_ST
    MARKET_QUERY --> QG_ST
    QG_ST --> S3_BACKUP
    QG_ST --> RDS_STORE
    QG_ST --> DDB_LOG
    
    %% Styling
    classDef lambda fill:#f3e5f5
    classDef db fill:#e8f5e8
    classDef ai fill:#fff8e1
    classDef storage fill:#fce4ec
    
    class QG_IN,QG_VAL,QG_DB,QG_AI,QG_ST lambda
    class PROD_FETCH,PROD_INS,QUERY_INS,QUERY_FETCH db
    class PROD_ANAL,QUERY_GEN,PROD_QUERY,MARKET_QUERY ai
    class S3_BACKUP,RDS_STORE,DDB_LOG storage
```

### 3. LLM Orchestrator Component Architecture

```mermaid
graph TD
    subgraph "LLM Orchestrator Lambda"
        LO_IN[Input Handler]
        LO_VAL[Input Validation]
        LO_DIST[Query Distributor]
        LO_AGG[Result Aggregator]
        LO_ST[Storage Handler]
    end
    
    subgraph "LLM Providers"
        subgraph "AI Mode"
            AM_API[ScrapingDog API]
            AM_PROC[Response Processor]
        end
        
        subgraph "AI Overview"
            AO_API[AI Overview API]
            AO_PROC[Response Processor]
        end
        
        subgraph "ChatGPT"
            CG_BROWSER[Playwright Browser]
            CG_CRAWL[crawl4ai Engine]
            CG_PROC[Response Processor]
        end
        
        subgraph "Perplexity"
            PX_API[Perplexity API]
            PX_PROC[Response Processor]
        end
    end
    
    subgraph "Result Processing"
        NORM[Normalization Engine]
        DEDUP[Deduplication]
        RANK[Ranking Engine]
        FORMAT[Format Standardizer]
    end
    
    LO_IN --> LO_VAL
    LO_VAL --> LO_DIST
    LO_DIST --> AM_API
    LO_DIST --> AO_API
    LO_DIST --> CG_BROWSER
    LO_DIST --> PX_API
    
    AM_API --> AM_PROC
    AO_API --> AO_PROC
    CG_BROWSER --> CG_CRAWL
    CG_CRAWL --> CG_PROC
    PX_API --> PX_PROC
    
    AM_PROC --> LO_AGG
    AO_PROC --> LO_AGG
    CG_PROC --> LO_AGG
    PX_PROC --> LO_AGG
    
    LO_AGG --> NORM
    NORM --> DEDUP
    DEDUP --> RANK
    RANK --> FORMAT
    FORMAT --> LO_ST
    
    %% Styling
    classDef lambda fill:#f3e5f5
    classDef llm fill:#fff8e1
    classDef process fill:#e8f5e8
    
    class LO_IN,LO_VAL,LO_DIST,LO_AGG,LO_ST lambda
    class AM_API,AM_PROC,AO_API,AO_PROC,CG_BROWSER,CG_CRAWL,CG_PROC,PX_API,PX_PROC llm
    class NORM,DEDUP,RANK,FORMAT process
```

## Data Storage Architecture

### S3 Storage Structure

```mermaid
graph TD
    subgraph "S3 Bucket: bodhium-data"
        subgraph "crawl-data/"
            subgraph "domain.com/"
                subgraph "2024-01-15_14-30-25/"
                    MD[markdown/]
                    IMG[images/]
                    CSV[csv/]
                    JSON[json/]
                    TREE[tree.md]
                end
            end
        end
        
        subgraph "query-data/"
            Q_JSON[queries.json]
            Q_CSV[queries.csv]
        end
        
        subgraph "results/"
            R_JSON[results.json]
            R_CSV[results.csv]
            R_HTML[results.html]
        end
        
        subgraph "logs/"
            ERROR[error-logs/]
            DEBUG[debug-logs/]
            METRICS[metrics/]
        end
    end
    
    %% Styling
    classDef s3 fill:#e8f5e8
    classDef data fill:#fff3e0
    
    class MD,IMG,CSV,JSON,TREE,Q_JSON,Q_CSV,R_JSON,R_CSV,R_HTML,ERROR,DEBUG,METRICS s3
```

### RDS Database Schema

```mermaid
erDiagram
    PRODUCTS {
        int product_id PK
        jsonb product_data
        varchar brand_name
        varchar product_hash
        timestamp created_at
        timestamp updated_at
    }
    
    QUERIES {
        int query_id PK
        int product_id FK
        text query_text
        varchar query_type
        boolean is_active
        timestamp created_at
    }
    
    RESULTS {
        int result_id PK
        int query_id FK
        varchar llm_provider
        jsonb response_data
        timestamp created_at
    }
    
    PRODUCTS ||--o{ QUERIES : "has"
    QUERIES ||--o{ RESULTS : "generates"
```

### DynamoDB Logging Structure

```mermaid
graph TD
    subgraph "DynamoDB Table: OrchestrationLogs"
        subgraph "Partition Key: job_id"
            subgraph "Sort Key: timestamp#event_id"
                JOB_START[JobStarted]
                JOB_PROGRESS[JobProgress]
                JOB_COMPLETE[JobComplete]
                JOB_ERROR[JobError]
            end
        end
        
        subgraph "Event Details"
            EXEC_TIME[execution_time]
            PRODUCTS_COUNT[products_count]
            QUERIES_COUNT[queries_count]
            S3_PATH[s3_output_path]
            ERROR_MSG[error_message]
            METRICS[performance_metrics]
        end
    end
    
    %% Styling
    classDef ddb fill:#fce4ec
    classDef event fill:#fff3e0
    
    class JOB_START,JOB_PROGRESS,JOB_COMPLETE,JOB_ERROR,EXEC_TIME,PRODUCTS_COUNT,QUERIES_COUNT,S3_PATH,ERROR_MSG,METRICS ddb
```

## Security Architecture

### Authentication and Authorization Flow

```mermaid
graph TD
    subgraph "Security Layer"
        AUTH[Authentication]
        AUTHZ[Authorization]
        ENCRYPT[Encryption]
        AUDIT[Audit Logging]
    end
    
    subgraph "API Gateway Security"
        API_KEY[API Key Validation]
        RATE_LIMIT[Rate Limiting]
        CORS[CORS Configuration]
        WAF[WAF Rules]
    end
    
    subgraph "Lambda Security"
        IAM_ROLE[IAM Roles]
        ENV_VARS[Environment Variables]
        SECRETS[Secrets Manager]
        VPC[VPC Configuration]
    end
    
    subgraph "Data Security"
        S3_ENCRYPT[S3 Encryption]
        RDS_ENCRYPT[RDS Encryption]
        DDB_ENCRYPT[DynamoDB Encryption]
        TLS[TLS/SSL]
    end
    
    AUTH --> API_KEY
    AUTHZ --> IAM_ROLE
    ENCRYPT --> S3_ENCRYPT
    ENCRYPT --> RDS_ENCRYPT
    ENCRYPT --> DDB_ENCRYPT
    ENCRYPT --> TLS
    AUDIT --> DDB_ENCRYPT
    
    %% Styling
    classDef security fill:#ffebee
    classDef api fill:#fff3e0
    classDef lambda fill:#f3e5f5
    classDef data fill:#e8f5e8
    
    class AUTH,AUTHZ,ENCRYPT,AUDIT security
    class API_KEY,RATE_LIMIT,CORS,WAF api
    class IAM_ROLE,ENV_VARS,SECRETS,VPC lambda
    class S3_ENCRYPT,RDS_ENCRYPT,DDB_ENCRYPT,TLS data
```

## Performance Architecture

### Scalability and Load Balancing

```mermaid
graph TD
    subgraph "Auto Scaling"
        ASG[Auto Scaling Group]
        TARGET[Target Tracking]
        SCHEDULE[Scheduled Scaling]
        STEP[Step Scaling]
    end
    
    subgraph "Load Balancing"
        ALB[Application Load Balancer]
        TG[Target Groups]
        HEALTH[Health Checks]
        STICKY[Sticky Sessions]
    end
    
    subgraph "Caching"
        CLOUDFRONT[CloudFront CDN]
        ELB[ElastiCache]
        S3_CACHE[S3 Caching]
    end
    
    subgraph "Database Scaling"
        RDS_READ[Read Replicas]
        RDS_MULTI[Multi-AZ]
        DDB_AUTO[DynamoDB Auto Scaling]
    end
    
    ASG --> ALB
    ALB --> TG
    TG --> HEALTH
    ALB --> CLOUDFRONT
    CLOUDFRONT --> S3_CACHE
    TG --> RDS_READ
    RDS_READ --> RDS_MULTI
    DDB_AUTO --> DDB_ENCRYPT
    
    %% Styling
    classDef scaling fill:#e1f5fe
    classDef lb fill:#fff3e0
    classDef cache fill:#f3e5f5
    classDef db fill:#e8f5e8
    
    class ASG,TARGET,SCHEDULE,STEP scaling
    class ALB,TG,HEALTH,STICKY lb
    class CLOUDFRONT,ELB,S3_CACHE cache
    class RDS_READ,RDS_MULTI,DDB_AUTO db
```

## Monitoring and Observability

### CloudWatch Monitoring Stack

```mermaid
graph TD
    subgraph "CloudWatch Metrics"
        LAMBDA_METRICS[Lambda Metrics]
        S3_METRICS[S3 Metrics]
        RDS_METRICS[RDS Metrics]
        DDB_METRICS[DynamoDB Metrics]
        API_METRICS[API Gateway Metrics]
    end
    
    subgraph "CloudWatch Logs"
        LAMBDA_LOGS[Lambda Logs]
        API_LOGS[API Gateway Logs]
        APPLICATION_LOGS[Application Logs]
        ERROR_LOGS[Error Logs]
    end
    
    subgraph "CloudWatch Alarms"
        ERROR_ALARM[Error Rate Alarm]
        DURATION_ALARM[Duration Alarm]
        THROTTLE_ALARM[Throttle Alarm]
        COST_ALARM[Cost Alarm]
    end
    
    subgraph "Notifications"
        SNS[SNS Topic]
        EMAIL[Email Notifications]
        SMS[SMS Notifications]
        SLACK[Slack Notifications]
    end
    
    LAMBDA_METRICS --> ERROR_ALARM
    S3_METRICS --> COST_ALARM
    RDS_METRICS --> THROTTLE_ALARM
    DDB_METRICS --> THROTTLE_ALARM
    API_METRICS --> DURATION_ALARM
    
    ERROR_ALARM --> SNS
    DURATION_ALARM --> SNS
    THROTTLE_ALARM --> SNS
    COST_ALARM --> SNS
    
    SNS --> EMAIL
    SNS --> SMS
    SNS --> SLACK
    
    %% Styling
    classDef metrics fill:#e1f5fe
    classDef logs fill:#fff3e0
    classDef alarms fill:#ffebee
    classDef notify fill:#f3e5f5
    
    class LAMBDA_METRICS,S3_METRICS,RDS_METRICS,DDB_METRICS,API_METRICS metrics
    class LAMBDA_LOGS,API_LOGS,APPLICATION_LOGS,ERROR_LOGS logs
    class ERROR_ALARM,DURATION_ALARM,THROTTLE_ALARM,COST_ALARM alarms
    class SNS,EMAIL,SMS,SLACK notify
```

## Cost Optimization Architecture

### Resource Management and Cost Control

```mermaid
graph TD
    subgraph "Cost Monitoring"
        BUDGET[Budget Alerts]
        COST_TRACKING[Cost Tracking]
        USAGE_ANALYSIS[Usage Analysis]
        OPTIMIZATION[Optimization Recommendations]
    end
    
    subgraph "Resource Optimization"
        LAMBDA_OPT[Lambda Optimization]
        S3_OPT[S3 Optimization]
        RDS_OPT[RDS Optimization]
        DDB_OPT[DynamoDB Optimization]
    end
    
    subgraph "Token Usage Management"
        GEMINI_TOKENS[Gemini Token Tracking]
        TIER_PRICING[Tier-based Pricing]
        TOKEN_LIMITS[Token Limits]
        COST_THROTTLE[Cost-based Throttling]
    end
    
    subgraph "Auto Scaling Policies"
        SCALE_UP[Scale Up Policy]
        SCALE_DOWN[Scale Down Policy]
        COST_THRESHOLD[Cost Thresholds]
        PERFORMANCE_THRESHOLD[Performance Thresholds]
    end
    
    BUDGET --> COST_TRACKING
    COST_TRACKING --> USAGE_ANALYSIS
    USAGE_ANALYSIS --> OPTIMIZATION
    
    OPTIMIZATION --> LAMBDA_OPT
    OPTIMIZATION --> S3_OPT
    OPTIMIZATION --> RDS_OPT
    OPTIMIZATION --> DDB_OPT
    
    GEMINI_TOKENS --> TIER_PRICING
    TIER_PRICING --> TOKEN_LIMITS
    TOKEN_LIMITS --> COST_THROTTLE
    
    COST_THRESHOLD --> SCALE_UP
    COST_THRESHOLD --> SCALE_DOWN
    PERFORMANCE_THRESHOLD --> SCALE_UP
    PERFORMANCE_THRESHOLD --> SCALE_DOWN
    
    %% Styling
    classDef cost fill:#fff3e0
    classDef optimize fill:#e8f5e8
    classDef tokens fill:#f3e5f5
    classDef scaling fill:#fce4ec
    
    class BUDGET,COST_TRACKING,USAGE_ANALYSIS,OPTIMIZATION cost
    class LAMBDA_OPT,S3_OPT,RDS_OPT,DDB_OPT optimize
    class GEMINI_TOKENS,TIER_PRICING,TOKEN_LIMITS,COST_THROTTLE tokens
    class SCALE_UP,SCALE_DOWN,COST_THRESHOLD,PERFORMANCE_THRESHOLD scaling
```

## Complete System Integration

### End-to-End Architecture Overview

```mermaid
graph TB
    %% User Layer
    subgraph "User Interface"
        UI[React Frontend]
        UI --> |HTTP/WebSocket| AG
    end
    
    %% API Layer
    subgraph "API Gateway"
        AG[API Gateway]
        AG --> |POST /scrape| WS
        AG --> |POST /generate-queries| QG
        AG --> |POST /process-queries| LO
    end
    
    %% Lambda Layer
    subgraph "Lambda Functions"
        WS[Web Scraper Lambda]
        QG[Query Generator Lambda]
        LO[LLM Orchestrator Lambda]
    end
    
    %% AWS Services
    subgraph "AWS Infrastructure"
        AB[AWS Batch]
        S3[S3 Storage]
        RDS[RDS PostgreSQL]
        DDB[DynamoDB]
        SM[Secrets Manager]
        CW[CloudWatch]
    end
    
    %% LLM Providers
    subgraph "LLM Services"
        AM[AI Mode]
        AO[AI Overview]
        CG[ChatGPT]
        PX[Perplexity]
    end
    
    %% External APIs
    subgraph "External APIs"
        GEM[Google Gemini]
        CC[Common Crawl]
    end
    
    %% Data Flow
    WS --> AB
    WS --> S3
    WS --> RDS
    WS --> DDB
    WS --> GEM
    WS --> CC
    
    QG --> RDS
    QG --> S3
    QG --> DDB
    QG --> GEM
    
    LO --> AM
    LO --> AO
    LO --> CG
    LO --> PX
    LO --> S3
    LO --> RDS
    LO --> DDB
    
    %% Monitoring
    WS --> CW
    QG --> CW
    LO --> CW
    
    %% Security
    WS --> SM
    QG --> SM
    LO --> SM
    
    %% Styling
    classDef ui fill:#e1f5fe
    classDef api fill:#fff3e0
    classDef lambda fill:#f3e5f5
    classDef aws fill:#e8f5e8
    classDef llm fill:#fff8e1
    classDef external fill:#fce4ec
    
    class UI ui
    class AG api
    class WS,QG,LO lambda
    class AB,S3,RDS,DDB,SM,CW aws
    class AM,AO,CG,PX llm
    class GEM,CC external
```

## Architecture Principles

### 1. Scalability
- **Horizontal Scaling**: Lambda functions auto-scale based on demand
- **Database Scaling**: RDS read replicas and DynamoDB auto-scaling
- **Storage Scaling**: S3 with unlimited storage capacity

### 2. Reliability
- **Fault Tolerance**: Multi-AZ deployment for RDS
- **Error Handling**: Comprehensive retry logic and fallback mechanisms
- **Data Durability**: S3 99.999999999% durability

### 3. Security
- **Encryption**: Data encrypted at rest and in transit
- **Access Control**: IAM roles and policies
- **Secrets Management**: AWS Secrets Manager for API keys

### 4. Performance
- **Parallel Processing**: 4 LLM providers working simultaneously
- **Caching**: CloudFront CDN and ElastiCache
- **Optimization**: Lambda provisioned concurrency

### 5. Cost Optimization
- **Pay-per-use**: Lambda and DynamoDB pricing
- **Token Management**: Tiered pricing for Gemini API
- **Resource Optimization**: Auto-scaling based on usage

### 6. Monitoring
- **Comprehensive Logging**: CloudWatch logs and metrics
- **Real-time Alerts**: SNS notifications for critical events
- **Performance Tracking**: Detailed execution metrics

This architecture provides a robust, scalable, and cost-effective solution for AI-powered web scraping and analysis, with comprehensive monitoring and security features. 