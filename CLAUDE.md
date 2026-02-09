# CLAUDE.md - Auto Estética Management System (AEMS)

## Visão Geral do Projeto

O **AEMS** é um sistema de gestão para uma rede de **12 lojas de estética automotiva** que oferece serviços de instalação de película, funilaria e estética veicular para concessionárias parceiras (Toyota, BYD, Fiat, Hyundai).

### Problema que Resolvemos
- Falta de visibilidade em tempo real da operação
- Controle manual de estoque e insumos  
- Dificuldade em medir produtividade individual
- Ausência de padronização entre lojas
- Processos de aprovação lentos

### Stack Tecnológico
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0, PostgreSQL, Redis, Celery
- **Frontend:** React 18, TypeScript, TailwindCSS, Zustand, TanStack Query
- **Infra:** Docker, GitHub Actions, AWS/DigitalOcean

## Estrutura do Projeto

```
aems/
├── backend/
│   ├── app/
│   │   ├── main.py              # Entry point FastAPI
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── dependencies.py      # DI
│   │   ├── core/                # Security, permissions, exceptions
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── stores/
│   │   │   ├── service_orders/
│   │   │   ├── vehicles/
│   │   │   ├── inventory/
│   │   │   ├── purchase_requests/
│   │   │   ├── hr/
│   │   │   ├── incidents/
│   │   │   ├── reports/
│   │   │   └── notifications/
│   │   ├── db/                  # Database config
│   │   └── workers/             # Celery tasks
│   ├── tests/
│   ├── alembic/                 # Migrations
│   └── pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Design system primitives
│   │   │   ├── common/          # Layout, header, sidebar
│   │   │   └── domain/          # Business components
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
│
├── docs/                        # Documentação técnica
│   ├── 01_ARCHITECTURE.md       # Arquitetura do sistema
│   ├── 02_BACKEND.md            # Especificações backend
│   ├── 03_FRONTEND.md           # Especificações frontend
│   ├── 04_DATABASE.md           # Schema do banco de dados
│   ├── AGENT_DEVELOPMENT.md     # Agente de desenvolvimento
│   ├── AGENT_TESTING.md         # Agente de testes
│   └── AGENT_QUALITY.md         # Agente de qualidade
│
├── docker-compose.yml
└── CLAUDE.md                    # Este arquivo
```

## Épicos e Funcionalidades

### Épico 1: Controle de Acesso e Hierarquia
- **Feature 1.1:** Autenticação (JWT) e Autorização (RBAC)
- **Feature 1.2:** Gestão de Usuários
- **Roles:** Owner (dono), Supervisor, Operator (encarregado)

### Épico 2: Fluxo Operacional (Chão de Loja)
- **Feature 2.1:** Lançamento de Ordem de Serviço
  - Seleção de departamento (Película/Funilaria/Estética)
  - Registro fotográfico (mín. 4 fotos)
  - Mapa de avarias interativo
  - Vinculação de consultor
- **Feature 2.2:** Painel de Carros do Dia (Semáforo)
  - Cores: branco → amarelo → laranja → vermelho
  - Atualização em tempo real (WebSocket)
- **Feature 2.3:** Gestão de Status e Workflow
  - Estados: Aguardando → Fazendo → Inspeção → Pronto → Entregue
  - Registro de funcionários por O.S.
  - Checklist de qualidade obrigatório
- **Feature 2.4:** Conferência e Auditoria
  - NF obrigatória para película

### Épico 3: Gestão de Suprimentos e Estoque
- **Feature 3.1:** Solicitação de Compra
  - Categorias: Película, Estética, Máquinas, Uniformes
  - Níveis de urgência: Normal, Urgente, Crítico
- **Feature 3.2:** Aprovação de Pedidos (Supervisor/Owner)
- **Feature 3.3:** Recebimento de Mercadoria
- **Feature 3.4:** Rastreabilidade de Películas
  - SMART ID: `[LOJA]-[TIPO]-[ANOMÊS]-[SEQ]` (ex: LJ01-FUM35-2601-001)
  - Cálculo automático de rendimento
  - Baixa automática baseada em serviços
  - Alertas de rendimento baixo

### Épico 4: Gestão de RH e Incidentes
- **Feature 4.1:** Registro de Ocorrências (faltas, advertências)
- **Feature 4.2:** Relato de Danos a Veículos
  - Identificação de responsável
  - Registro de valores

### Épico 5: Relatórios e BI
- **Feature 5.1:** Dashboard Executivo (metas, gauges)
- **Feature 5.2:** Ranking de Performance (instaladores)
- **Feature 5.3:** BI Multi-Loja (comparativos)
- **Feature 5.4:** Auditoria de Qualidade (checklist diário)
- **Feature 5.5:** Exportação (PDF, Excel)

## Comandos de Desenvolvimento

### Backend

```bash
# Setup
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -e ".[dev]"

# Iniciar servidor
uvicorn app.main:app --reload --port 8000

# Migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Testes
pytest
pytest --cov=app tests/
pytest tests/integration/ -v

# Linting
ruff check app/
mypy app/

# Celery
celery -A app.workers.celery_app worker --loglevel=info
celery -A app.workers.celery_app beat --loglevel=info
```

### Frontend

```bash
# Setup
cd frontend
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Linting
npm run lint
npm run type-check
```

### Docker

```bash
# Desenvolvimento completo
docker-compose up -d

# Apenas serviços (DB, Redis)
docker-compose up -d postgres redis

# Logs
docker-compose logs -f api

# Rebuild
docker-compose build --no-cache
```

## Padrões de Código

### Backend (Python)

```python
# Estrutura de módulo
modules/
├── {module}/
│   ├── __init__.py
│   ├── router.py      # Endpoints FastAPI
│   ├── service.py     # Lógica de negócio
│   ├── schemas.py     # Pydantic models
│   ├── models.py      # SQLAlchemy models
│   └── dependencies.py # DI específico do módulo

# Router pattern
@router.post("/", response_model=schemas.Response)
async def create_item(
    data: schemas.CreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await service.create(db, data, current_user)

# Service pattern
async def create(db: AsyncSession, data: CreateRequest, user: User) -> Model:
    # Validações
    # Lógica de negócio
    # Persistência
    # Eventos/Notificações
```

### Frontend (TypeScript/React)

```typescript
// Component pattern
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks no topo
  const { data, isLoading } = useQuery(...)
  const [state, setState] = useState(...)
  
  // Handlers
  const handleAction = useCallback(() => {...}, [deps])
  
  // Early returns
  if (isLoading) return <Skeleton />
  
  // Render
  return (...)
}

// Hook pattern
export function useFeature(param: string) {
  return useQuery({
    queryKey: ['feature', param],
    queryFn: () => featureService.get(param),
  })
}

// Service pattern
export const featureService = {
  list: async (params) => api.get('/feature', { params }),
  create: async (data) => api.post('/feature', data),
}
```

## Regras de Negócio Importantes

### Semáforo de O.S.
```
Película:
- Branco: < 45 min
- Amarelo: 45 min - 1h30
- Laranja: 1h30 - 3h
- Vermelho: > 3h

Estética:
- Branco: < 30 min
- Amarelo: 30 min - 1h
- Laranja: 1h - 2h
- Vermelho: > 2h
```

### SMART ID de Bobinas
```
Formato: [LOJA]-[TIPO]-[ANOMÊS]-[SEQ]
Exemplo: LJ01-FUM35-2601-001

LOJA: LJ01 a LJ12
TIPO: FUM35, FUM50, FUM70, CERA, NANO, etc.
ANOMÊS: YYMM (2601 = Janeiro 2026)
SEQ: 001-999 (reinicia mensalmente)
```

### Rendimento de Película
```
Rendimento = Metragem Utilizada / Metragem Nominal

Faixas aceitáveis:
- Fumê padrão: 88-95%
- Premium: 90-97%
- Segurança: 85-92%
```

### Permissões por Role
| Funcionalidade | Operator | Supervisor | Owner |
|----------------|:--------:|:----------:|:-----:|
| Lançar O.S. | ✅ | ❌ | ❌ |
| Ver Painel (própria loja) | ✅ | ✅ | ✅ |
| Ver Painel (outras lojas) | ❌ | ✅* | ✅ |
| Solicitar Compra | ✅ | ❌ | ❌ |
| Aprovar Compra | ❌ | ✅ | ✅ |
| Dashboard Executivo | ❌ | ✅** | ✅ |
| BI Multi-Loja | ❌ | ❌ | ✅ |
| Gestão de Usuários | ❌ | ❌ | ✅ |

*Apenas lojas sob sua supervisão
**Visão limitada às suas lojas

## Checklist de Qualidade

Antes de submeter código:

- [ ] Testes escritos e passando
- [ ] Sem erros de lint/type
- [ ] Migrations criadas (se alterou models)
- [ ] Documentação atualizada (se mudou API)
- [ ] Code review aprovado
- [ ] Testado em ambiente de homologação

## Ambientes

| Ambiente | URL | Branch |
|----------|-----|--------|
| Local | localhost:3000 / 8000 | - |
| Staging | staging.aems.com.br | develop |
| Production | app.aems.com.br | main |

## Agentes Disponíveis

Para desenvolvimento com Claude Code, utilize os agentes especializados:

| Agente | Arquivo | Propósito |
|--------|---------|-----------|
| **Desenvolvimento** | [AGENT_DEVELOPMENT.md](./docs/AGENT_DEVELOPMENT.md) | Implementação de código, padrões, exemplos de router/service/schemas/models |
| **Testes** | [AGENT_TESTING.md](./docs/AGENT_TESTING.md) | Testes unitários, integração e E2E, fixtures, factories |
| **Qualidade** | [AGENT_QUALITY.md](./docs/AGENT_QUALITY.md) | Code review, lint, segurança, performance, CI/CD |

### Como Usar os Agentes

1. **Ao desenvolver uma feature**: Consulte `AGENT_DEVELOPMENT.md` para padrões de código
2. **Ao escrever testes**: Consulte `AGENT_TESTING.md` para estrutura e exemplos
3. **Ao revisar código**: Consulte `AGENT_QUALITY.md` para checklists de qualidade

## Documentação Técnica

| Documento | Descrição |
|-----------|-----------|
| [01_ARCHITECTURE.md](./docs/01_ARCHITECTURE.md) | Arquitetura geral, stack, módulos, comunicação |
| [02_BACKEND.md](./docs/02_BACKEND.md) | FastAPI, models, schemas, endpoints, workflows |
| [03_FRONTEND.md](./docs/03_FRONTEND.md) | React, componentes, state, routing, forms |
| [04_DATABASE.md](./docs/04_DATABASE.md) | PostgreSQL schema, tabelas, views, triggers, índices |

## Contato

- **Product Owner:** [A definir]
- **Tech Lead:** [A definir]
- **Stakeholder:** Arthur (Dono da rede)

## Guia Rápido de Início

```bash
# 1. Clone o repositório
git clone https://github.com/empresa/aems.git
cd aems

# 2. Inicie os serviços com Docker
docker-compose up -d postgres redis

# 3. Configure o backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload

# 4. Configure o frontend (em outro terminal)
cd frontend
npm install
npm run dev

# 5. Acesse a aplicação
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
```

---

*CLAUDE.md v1.0*  
*Atualizado em: Janeiro/2026*  
*Documentação completa: 8 arquivos (CLAUDE.md + 4 specs + 3 agentes)*
