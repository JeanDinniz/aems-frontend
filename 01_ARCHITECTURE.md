# Arquitetura do Sistema - Auto Estética Management System (AEMS)

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                        │
├─────────────────┬──────────────────┬──────────────────┬────────────────────────┤
│   Web Browser   │   Tablet (PWA)   │   TV Dashboard   │   Future: Mobile App   │
│   (React SPA)   │   (React PWA)    │   (React)        │   (React Native)       │
└────────┬────────┴────────┬─────────┴────────┬─────────┴───────────┬────────────┘
         │                 │                  │                     │
         └─────────────────┴──────────────────┴─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER (Nginx)                               │
│                         - SSL Termination                                        │
│                         - Rate Limiting                                          │
│                         - Static Assets Cache                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   API Gateway   │    │    WebSocket Server │    │   Static Files      │
│   (FastAPI)     │    │    (Real-time)      │    │   (CDN/S3)          │
└────────┬────────┘    └──────────┬──────────┘    └─────────────────────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER                                     │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│   Auth Module   │   Core Module   │   Reports Module │   Notifications Module  │
│                 │                 │                  │                         │
│ - JWT Auth      │ - O.S. CRUD     │ - Dashboard      │ - Email (SendGrid)      │
│ - RBAC          │ - Workflow      │ - Analytics      │ - Push (Firebase)       │
│ - Session Mgmt  │ - Inventory     │ - PDF/Excel Gen  │ - WebSocket Events      │
└────────┬────────┴────────┬────────┴────────┬─────────┴───────────┬─────────────┘
         │                 │                 │                     │
         └─────────────────┴─────────────────┴─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                          │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│   PostgreSQL    │     Redis       │    S3/MinIO     │   Elasticsearch (opt)   │
│   (Primary DB)  │   (Cache/Queue) │   (File Storage)│   (Full-text Search)    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
```

## 2. Stack Tecnológico

### 2.1 Backend
| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Framework | **FastAPI** (Python 3.11+) | Alto performance, tipagem, async nativo, OpenAPI auto |
| ORM | **SQLAlchemy 2.0** + Alembic | Maturidade, migrations, async support |
| Validação | **Pydantic v2** | Validação robusta, integração FastAPI |
| Auth | **JWT** + bcrypt | Stateless, escalável |
| Testes | **pytest** + pytest-asyncio | Ecossistema Python padrão |
| Tasks | **Celery** + Redis | Jobs assíncronos, agendamento |
| WebSocket | **FastAPI WebSockets** | Real-time nativo |

### 2.2 Frontend
| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Framework | **React 18** + TypeScript | Ecossistema maduro, tipagem |
| State Mgmt | **Zustand** | Simples, performático, sem boilerplate |
| Data Fetching | **TanStack Query v5** | Cache, mutations, loading states |
| Forms | **React Hook Form** + Zod | Validação tipada, performance |
| UI Components | **Radix UI** + **Tailwind CSS** | Acessibilidade, customização |
| Charts | **Recharts** ou **Chart.js** | Dashboards interativos |
| Tables | **TanStack Table** | Tabelas complexas, virtualization |
| Routing | **React Router v6** | Standard, nested routes |

### 2.3 Infraestrutura
| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Container | **Docker** + Docker Compose | Consistência ambiente |
| Orquestração | **Docker Swarm** ou **K8s** | Escalabilidade (fase futura) |
| CI/CD | **GitHub Actions** | Integração native com repo |
| Hosting | **AWS** ou **DigitalOcean** | Flexibilidade, custo |
| CDN | **CloudFront** ou **Cloudflare** | Assets estáticos |
| Monitoring | **Prometheus** + **Grafana** | Métricas e alertas |
| Logs | **Loki** ou **CloudWatch** | Agregação de logs |

## 3. Estrutura de Módulos

### 3.1 Módulos do Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Settings (pydantic-settings)
│   ├── dependencies.py            # Dependency injection
│   │
│   ├── core/                      # Core utilities
│   │   ├── security.py            # JWT, hashing
│   │   ├── permissions.py         # RBAC logic
│   │   └── exceptions.py          # Custom exceptions
│   │
│   ├── modules/
│   │   ├── auth/                  # Épico 1
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── users/                 # Épico 1
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── stores/                # Multi-loja
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── service_orders/        # Épico 2
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   └── workflows.py       # State machine
│   │   │
│   │   ├── vehicles/              # Épico 2
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── inventory/             # Épico 3
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   └── smart_id.py        # SMART ID generator
│   │   │
│   │   ├── purchase_requests/     # Épico 3
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── hr/                    # Épico 4
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── incidents/             # Épico 4
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── reports/               # Épico 5
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   ├── generators/
│   │   │   │   ├── pdf.py
│   │   │   │   └── excel.py
│   │   │   └── dashboards/
│   │   │       ├── executive.py
│   │   │       ├── ranking.py
│   │   │       └── quality.py
│   │   │
│   │   └── notifications/         # Cross-cutting
│   │       ├── router.py
│   │       ├── service.py
│   │       └── channels/
│   │           ├── email.py
│   │           ├── push.py
│   │           └── websocket.py
│   │
│   ├── db/
│   │   ├── base.py               # SQLAlchemy base
│   │   ├── session.py            # Session factory
│   │   └── migrations/           # Alembic migrations
│   │
│   └── workers/                  # Celery tasks
│       ├── __init__.py
│       ├── celery_app.py
│       ├── inventory_tasks.py
│       ├── report_tasks.py
│       └── notification_tasks.py
│
├── tests/
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── alembic.ini
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml
```

### 3.2 Módulos do Frontend

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   │
│   ├── config/
│   │   ├── api.ts                # Axios instance
│   │   ├── routes.ts             # Route definitions
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── useWebSocket.ts
│   │   └── useStore.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── serviceOrder.service.ts
│   │   ├── inventory.service.ts
│   │   ├── hr.service.ts
│   │   └── reports.service.ts
│   │
│   ├── components/
│   │   ├── ui/                   # Primitivos (Radix-based)
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   └── ...
│   │   │
│   │   ├── common/               # Componentes compartilhados
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── PageLayout/
│   │   │   ├── LoadingSpinner/
│   │   │   └── ErrorBoundary/
│   │   │
│   │   └── domain/               # Componentes de domínio
│   │       ├── ServiceOrderCard/
│   │       ├── SemaphorePanel/
│   │       ├── DamageMap/
│   │       ├── PhotoCapture/
│   │       ├── QualityChecklist/
│   │       └── ...
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── ForgotPassword.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ExecutiveDashboard.tsx
│   │   │   ├── SupervisorDashboard.tsx
│   │   │   └── OperatorDashboard.tsx
│   │   │
│   │   ├── service-orders/
│   │   │   ├── List.tsx
│   │   │   ├── Create.tsx
│   │   │   ├── Detail.tsx
│   │   │   └── DayPanel.tsx      # Painel semáforo
│   │   │
│   │   ├── inventory/
│   │   │   ├── Stock.tsx
│   │   │   ├── PurchaseRequests.tsx
│   │   │   ├── Approvals.tsx
│   │   │   └── FilmTracking.tsx  # Rastreabilidade
│   │   │
│   │   ├── hr/
│   │   │   ├── Occurrences.tsx
│   │   │   ├── Incidents.tsx
│   │   │   └── EmployeeFile.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── Performance.tsx
│   │   │   ├── Ranking.tsx
│   │   │   ├── Quality.tsx
│   │   │   └── Export.tsx
│   │   │
│   │   └── admin/
│   │       ├── Users.tsx
│   │       ├── Stores.tsx
│   │       └── Settings.tsx
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── MainLayout.tsx
│   │   └── TVLayout.tsx          # Para displays de loja
│   │
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── serviceOrder.types.ts
│   │   └── ...
│   │
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       ├── dateHelpers.ts
│       └── permissions.ts
│
├── public/
│   ├── assets/
│   │   └── vehicle-map/          # SVGs do mapa de avarias
│   └── locales/
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── Dockerfile
```

## 4. Padrões de Comunicação

### 4.1 API REST
- Padrão RESTful com recursos bem definidos
- Versionamento: `/api/v1/...`
- Paginação: `?page=1&limit=20`
- Filtros: `?status=active&store_id=1`
- Sorting: `?sort=-created_at` (prefixo `-` para DESC)

### 4.2 WebSocket Events
```typescript
// Conexão por loja
ws://api/ws/{store_id}

// Eventos
{
  "event": "os_status_changed",
  "data": { "os_id": 123, "new_status": "in_progress" }
}

{
  "event": "semaphore_update", 
  "data": { "os_id": 123, "color": "yellow", "wait_time": 45 }
}

{
  "event": "new_purchase_request",
  "data": { "request_id": 456, "urgency": "critical" }
}
```

### 4.3 Background Jobs (Celery)
- Geração de relatórios pesados
- Envio de notificações em batch
- Cálculos de métricas agregadas
- Alertas de rendimento de película
- Escalação de solicitações de compra

## 5. Segurança

### 5.1 Autenticação
- JWT com access token (8h) + refresh token (7d)
- Rotação de refresh token a cada uso
- Blacklist de tokens revogados (Redis)

### 5.2 Autorização (RBAC)
```python
# Hierarquia de roles
ROLES = {
    "owner": ["supervisor", "operator", "viewer"],
    "supervisor": ["operator", "viewer"],
    "operator": ["viewer"],
    "viewer": []
}

# Permissões por recurso
PERMISSIONS = {
    "service_orders": {
        "create": ["operator"],
        "read": ["viewer"],
        "update_status": ["operator"],
        "delete": []  # Ninguém pode deletar
    },
    "purchase_requests": {
        "create": ["operator"],
        "approve": ["supervisor", "owner"],
        "read": ["viewer"]
    },
    # ...
}
```

### 5.3 Proteções
- Rate limiting por IP e usuário
- CORS configurado por ambiente
- Input sanitization (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (React escaping)
- CSRF tokens para forms críticos

## 6. Performance

### 6.1 Caching Strategy
```
┌─────────────────────────────────────────────┐
│              CACHE LAYERS                    │
├─────────────────────────────────────────────┤
│ L1: Browser (HTTP Cache Headers)            │
│     - Assets: 1 year                         │
│     - API: no-cache + ETags                  │
├─────────────────────────────────────────────┤
│ L2: CDN (CloudFront/Cloudflare)             │
│     - Static files                           │
│     - Images                                 │
├─────────────────────────────────────────────┤
│ L3: Application (Redis)                     │
│     - Session data: 24h                      │
│     - Dashboard metrics: 5min                │
│     - Service catalog: 1h                    │
│     - User permissions: 15min                │
└─────────────────────────────────────────────┘
```

### 6.2 Database Optimization
- Índices em colunas frequentemente filtradas
- Particionamento de tabelas grandes (logs, histórico)
- Connection pooling (SQLAlchemy + asyncpg)
- Read replicas para relatórios (futuro)

## 7. Observabilidade

### 7.1 Métricas (Prometheus)
- Request latency (p50, p95, p99)
- Error rates
- Active connections
- Database query times
- Cache hit rates

### 7.2 Logs (Structured JSON)
```json
{
  "timestamp": "2026-01-23T10:30:00Z",
  "level": "INFO",
  "service": "api",
  "trace_id": "abc123",
  "user_id": 45,
  "store_id": 3,
  "action": "os_created",
  "data": {"os_id": 789}
}
```

### 7.3 Alertas
- Error rate > 1% → PagerDuty
- Latency p95 > 500ms → Slack
- Database connections > 80% → Email
- Disk usage > 85% → Critical alert

## 8. Deployment

### 8.1 Ambientes
| Ambiente | Propósito | URL |
|----------|-----------|-----|
| Development | Local dev | localhost:3000/8000 |
| Staging | QA/Homolog | staging.aems.com.br |
| Production | Live | app.aems.com.br |

### 8.2 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
1. Lint + Type Check
2. Unit Tests
3. Integration Tests
4. Build Docker Images
5. Push to Registry
6. Deploy to Staging (auto)
7. E2E Tests on Staging
8. Deploy to Production (manual approval)
9. Smoke Tests
10. Rollback if needed
```

## 9. Escalabilidade Futura

### Fase 1 (MVP)
- Single server setup
- Docker Compose
- PostgreSQL single instance
- Redis single instance

### Fase 2 (Scale-out)
- Load balancer
- Multiple API instances
- Redis cluster
- Database read replicas

### Fase 3 (Enterprise)
- Kubernetes orchestration
- Auto-scaling
- Multi-region (DR)
- Event-driven architecture

---

*Documento de Arquitetura v1.0*  
*Última atualização: Janeiro/2026*
