# Especificação Técnica - Backend

## 1. Visão Geral

O backend do AEMS é construído com **FastAPI** seguindo arquitetura modular, princípios SOLID e Clean Architecture adaptada para o contexto Python.

## 2. Setup do Projeto

### 2.1 Dependências Principais

```toml
# pyproject.toml
[project]
name = "aems-backend"
version = "1.0.0"
requires-python = ">=3.11"

dependencies = [
    # Framework
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "python-multipart>=0.0.6",
    
    # Database
    "sqlalchemy[asyncio]>=2.0.25",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    
    # Validation & Settings
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    
    # Auth & Security
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    
    # Cache & Queue
    "redis>=5.0.0",
    "celery>=5.3.0",
    
    # File Handling
    "boto3>=1.34.0",           # S3 storage
    "pillow>=10.2.0",          # Image processing
    "python-magic>=0.4.27",    # File type detection
    
    # Reports
    "openpyxl>=3.1.0",         # Excel
    "weasyprint>=60.0",        # PDF
    "jinja2>=3.1.0",           # Templates
    
    # Notifications
    "sendgrid>=6.11.0",        # Email
    "firebase-admin>=6.3.0",   # Push notifications
    
    # Monitoring
    "prometheus-client>=0.19.0",
    "structlog>=24.1.0",
    
    # QR Code
    "qrcode[pil]>=7.4.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "httpx>=0.26.0",           # Test client
    "factory-boy>=3.3.0",      # Test factories
    "faker>=22.0.0",
    "ruff>=0.1.0",             # Linting
    "mypy>=1.8.0",             # Type checking
    "pre-commit>=3.6.0",
]
```

### 2.2 Configuração (Settings)

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AEMS API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Auth
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # Storage
    S3_BUCKET: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_ENDPOINT: str | None = None  # For MinIO
    
    # Email
    SENDGRID_API_KEY: str
    FROM_EMAIL: str = "noreply@aems.com.br"
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str | None = None
    
    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

## 3. Módulos e APIs

### 3.1 Módulo de Autenticação (Épico 1)

#### Models

```python
# app/modules/auth/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class UserRole(str, enum.Enum):
    OWNER = "owner"
    SUPERVISOR = "supervisor"
    OPERATOR = "operator"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # Relationships
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    store = relationship("Store", back_populates="users")
    
    # Para supervisores: múltiplas lojas
    supervised_stores = relationship(
        "Store", 
        secondary="user_store_supervision",
        back_populates="supervisors"
    )
    
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, onupdate="now()")
    
class UserStoreSupervision(Base):
    """Tabela associativa para supervisores multi-loja"""
    __tablename__ = "user_store_supervision"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    store_id = Column(Integer, ForeignKey("stores.id"), primary_key=True)

class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)  # login, logout, access_denied
    resource = Column(String(255), nullable=True)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    timestamp = Column(DateTime, server_default="now()")
    success = Column(Boolean, default=True)
```

#### Schemas

```python
# app/modules/auth/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from app.modules.auth.models import UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole
    store_id: int | None = None
    supervised_store_ids: list[int] = []

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    store_id: int | None
    supervised_store_ids: list[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
```

#### Endpoints

```python
# app/modules/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.modules.auth import service, schemas
from app.core.security import get_current_user
from app.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db = Depends(get_db)
):
    """
    Autenticação com email e senha.
    - Valida credenciais
    - Verifica bloqueio por tentativas falhas
    - Retorna JWT access + refresh token
    """
    return await service.authenticate(db, form_data.username, form_data.password)

@router.post("/refresh", response_model=schemas.LoginResponse)
async def refresh_token(
    refresh_token: str,
    db = Depends(get_db)
):
    """Renova access token usando refresh token válido."""
    return await service.refresh_access_token(db, refresh_token)

@router.post("/logout")
async def logout(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Revoga tokens do usuário."""
    return await service.logout(db, current_user)

@router.post("/forgot-password")
async def forgot_password(
    email: schemas.EmailStr,
    db = Depends(get_db)
):
    """Envia email com link de recuperação."""
    return await service.send_password_reset(db, email)

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db = Depends(get_db)
):
    """Redefine senha usando token de recuperação."""
    return await service.reset_password(db, token, new_password)

@router.post("/change-password")
async def change_password(
    data: schemas.PasswordChange,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Troca de senha (primeiro acesso ou voluntária)."""
    return await service.change_password(db, current_user, data)
```

### 3.2 Módulo de Ordens de Serviço (Épico 2)

#### Models

```python
# app/modules/service_orders/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class Department(str, enum.Enum):
    FILM = "film"           # Película
    BODYWORK = "bodywork"   # Funilaria  
    ESTHETICS = "esthetics" # Estética

class OSStatus(str, enum.Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    QUALITY_CHECK = "quality_check"
    COMPLETED = "completed"
    DELIVERED = "delivered"

class SemaphoreColor(str, enum.Enum):
    WHITE = "white"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"

class ServiceOrder(Base):
    __tablename__ = "service_orders"
    
    id = Column(Integer, primary_key=True)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    
    # Vehicle
    plate = Column(String(10), nullable=False, index=True)
    model = Column(String(100), nullable=False)
    color = Column(String(50))
    vehicle_type = Column(String(50))  # hatch, sedan, suv, pickup
    
    # Relationships
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    dealership_id = Column(Integer, ForeignKey("dealerships.id"), nullable=False)
    consultant_id = Column(Integer, ForeignKey("consultants.id"), nullable=True)
    
    # Services
    department = Column(Enum(Department), nullable=False)
    services = relationship("ServiceOrderItem", back_populates="order")
    
    # Status
    status = Column(Enum(OSStatus), default=OSStatus.WAITING)
    semaphore_color = Column(Enum(SemaphoreColor), default=SemaphoreColor.WHITE)
    
    # Times
    entry_time = Column(DateTime, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Documentation
    entry_photos = Column(JSON, default=list)  # URLs das fotos
    damage_map = Column(JSON, nullable=True)   # Coordenadas e tipos de avarias
    
    # Compliance
    invoice_number = Column(String(20), nullable=True)  # NF obrigatória para película
    
    # Workers
    workers = relationship("ServiceOrderWorker", back_populates="order")
    
    # Quality
    quality_checklist = Column(JSON, nullable=True)
    quality_approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    quality_approved_at = Column(DateTime, nullable=True)
    
    # Audit
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, onupdate="now()")

class ServiceOrderItem(Base):
    """Serviços individuais dentro da O.S."""
    __tablename__ = "service_order_items"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    # Específico para película
    film_type = Column(String(50), nullable=True)
    film_metragem = Column(Float, nullable=True)
    film_bobbin_id = Column(Integer, ForeignKey("film_bobbins.id"), nullable=True)
    
    price = Column(Float, nullable=False)
    
    order = relationship("ServiceOrder", back_populates="services")
    service = relationship("Service")

class ServiceOrderWorker(Base):
    """Funcionários que trabalharam na O.S."""
    __tablename__ = "service_order_workers"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_primary = Column(Boolean, default=False)
    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    
    order = relationship("ServiceOrder", back_populates="workers")
    user = relationship("User")

class StatusHistory(Base):
    """Histórico de mudanças de status."""
    __tablename__ = "status_history"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=False)
    from_status = Column(Enum(OSStatus))
    to_status = Column(Enum(OSStatus), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, server_default="now()")
    notes = Column(String(500))
```

#### Schemas

```python
# app/modules/service_orders/schemas.py
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import re

class PlateValidator:
    PLATE_REGEX = r'^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'
    
    @classmethod
    def validate(cls, plate: str) -> str:
        plate = plate.upper().replace("-", "")
        if not re.match(cls.PLATE_REGEX, plate):
            raise ValueError("Formato de placa inválido")
        return plate

class DamagePoint(BaseModel):
    x: float = Field(..., ge=0, le=1)  # Coordenada relativa
    y: float = Field(..., ge=0, le=1)
    type: str  # arranhao, amassado, trinca, mancha
    description: str | None = None

class ServiceOrderCreate(BaseModel):
    plate: str
    model: str
    color: str | None = None
    vehicle_type: str | None = None
    department: str
    dealership_id: int
    consultant_id: int | None = None
    service_ids: list[int]
    entry_photos: list[str] = []  # URLs
    damage_map: list[DamagePoint] = []
    
    @validator("plate")
    def validate_plate(cls, v):
        return PlateValidator.validate(v)

class ServiceOrderResponse(BaseModel):
    id: int
    order_number: str
    plate: str
    model: str
    department: str
    status: str
    semaphore_color: str
    entry_time: datetime
    wait_time_minutes: int
    services: list[dict]
    consultant_name: str | None
    dealership_name: str
    
    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str
    worker_ids: list[int] | None = None  # Obrigatório para in_progress
    quality_checklist: dict | None = None  # Obrigatório para completed
    invoice_number: str | None = None  # Obrigatório para película
    notes: str | None = None

class SemaphoreConfig(BaseModel):
    department: str
    white_max_minutes: int
    yellow_max_minutes: int
    orange_max_minutes: int
    # Acima de orange_max = vermelho
```

#### Workflow (State Machine)

```python
# app/modules/service_orders/workflows.py
from enum import Enum
from typing import Callable
from app.modules.service_orders.models import OSStatus, Department

class OSWorkflow:
    """
    State machine para O.S.
    Define transições válidas e validações por transição.
    """
    
    TRANSITIONS = {
        OSStatus.WAITING: [OSStatus.IN_PROGRESS],
        OSStatus.IN_PROGRESS: [OSStatus.QUALITY_CHECK, OSStatus.WAITING],  # Pode voltar se pausar
        OSStatus.QUALITY_CHECK: [OSStatus.COMPLETED, OSStatus.IN_PROGRESS],  # Pode reprovar
        OSStatus.COMPLETED: [OSStatus.DELIVERED],
        OSStatus.DELIVERED: [],  # Estado final
    }
    
    @classmethod
    def can_transition(cls, from_status: OSStatus, to_status: OSStatus) -> bool:
        return to_status in cls.TRANSITIONS.get(from_status, [])
    
    @classmethod
    def validate_transition(
        cls, 
        order: "ServiceOrder", 
        to_status: OSStatus,
        data: dict
    ) -> list[str]:
        """Retorna lista de erros de validação."""
        errors = []
        
        if not cls.can_transition(order.status, to_status):
            errors.append(f"Transição inválida: {order.status} → {to_status}")
            return errors
        
        # Validações específicas por transição
        if to_status == OSStatus.IN_PROGRESS:
            if not data.get("worker_ids"):
                errors.append("É obrigatório informar os funcionários")
        
        elif to_status == OSStatus.COMPLETED:
            if not data.get("quality_checklist"):
                errors.append("Checklist de qualidade é obrigatório")
            
            if order.department == Department.FILM:
                if not data.get("invoice_number"):
                    errors.append("Número da NF é obrigatório para película")
        
        return errors
```

#### Semáforo Calculator

```python
# app/modules/service_orders/semaphore.py
from datetime import datetime, timedelta
from app.modules.service_orders.models import SemaphoreColor, Department

class SemaphoreCalculator:
    """
    Calcula cor do semáforo baseado no tempo de espera e departamento.
    """
    
    THRESHOLDS = {
        Department.FILM: {
            SemaphoreColor.WHITE: 45,   # minutos
            SemaphoreColor.YELLOW: 90,
            SemaphoreColor.ORANGE: 180,
        },
        Department.ESTHETICS: {
            SemaphoreColor.WHITE: 30,
            SemaphoreColor.YELLOW: 60,
            SemaphoreColor.ORANGE: 120,
        },
        Department.BODYWORK: {
            SemaphoreColor.WHITE: 60,
            SemaphoreColor.YELLOW: 120,
            SemaphoreColor.ORANGE: 240,
        },
    }
    
    @classmethod
    def calculate(
        cls, 
        department: Department, 
        entry_time: datetime,
        now: datetime | None = None
    ) -> tuple[SemaphoreColor, int]:
        """
        Retorna (cor, minutos_de_espera)
        """
        now = now or datetime.utcnow()
        wait_minutes = int((now - entry_time).total_seconds() / 60)
        
        thresholds = cls.THRESHOLDS.get(department, cls.THRESHOLDS[Department.ESTHETICS])
        
        if wait_minutes < thresholds[SemaphoreColor.WHITE]:
            color = SemaphoreColor.WHITE
        elif wait_minutes < thresholds[SemaphoreColor.YELLOW]:
            color = SemaphoreColor.YELLOW
        elif wait_minutes < thresholds[SemaphoreColor.ORANGE]:
            color = SemaphoreColor.ORANGE
        else:
            color = SemaphoreColor.RED
        
        return color, wait_minutes
```

### 3.3 Módulo de Estoque (Épico 3)

#### SMART ID Generator

```python
# app/modules/inventory/smart_id.py
from datetime import datetime
from sqlalchemy import select, func
from app.db.session import AsyncSession

class SmartIDGenerator:
    """
    Gera identificadores únicos para bobinas de película.
    Formato: [LOJA]-[TIPO]-[ANOMÊS]-[SEQ]
    Exemplo: LJ01-FUM35-2601-001
    """
    
    FILM_TYPE_CODES = {
        "fume_35": "FUM35",
        "fume_50": "FUM50",
        "fume_70": "FUM70",
        "ceramic": "CERA",
        "nano": "NANO",
        "security": "SEGUR",
        "anti_uv": "ANTIUV",
    }
    
    @classmethod
    async def generate(
        cls,
        db: AsyncSession,
        store_id: int,
        film_type: str
    ) -> str:
        store_code = f"LJ{store_id:02d}"
        type_code = cls.FILM_TYPE_CODES.get(film_type, "OTHER")
        year_month = datetime.now().strftime("%y%m")
        
        # Buscar próximo sequencial do mês/loja/tipo
        prefix = f"{store_code}-{type_code}-{year_month}-"
        
        result = await db.execute(
            select(func.max(FilmBobbin.smart_id))
            .where(FilmBobbin.smart_id.like(f"{prefix}%"))
        )
        last_id = result.scalar()
        
        if last_id:
            last_seq = int(last_id.split("-")[-1])
            next_seq = last_seq + 1
        else:
            next_seq = 1
        
        return f"{prefix}{next_seq:03d}"
```

#### Yield Calculator

```python
# app/modules/inventory/yield_calculator.py
from dataclasses import dataclass

@dataclass
class YieldConfig:
    min_acceptable: float  # Ex: 0.85 (85%)
    max_acceptable: float  # Ex: 0.95 (95%)
    target: float          # Ex: 0.90 (90%)

class FilmYieldCalculator:
    """
    Calcula rendimento de bobinas de película.
    """
    
    YIELD_CONFIGS = {
        "fume_35": YieldConfig(0.88, 0.95, 0.92),
        "fume_50": YieldConfig(0.88, 0.95, 0.92),
        "premium": YieldConfig(0.90, 0.97, 0.94),
        "security": YieldConfig(0.85, 0.92, 0.88),
    }
    
    # Metragem padrão por tipo de veículo e vidro (em metros)
    VEHICLE_METRAGEM = {
        "hatch_small": {"windshield": 1.2, "side_4": 2.0, "rear": 0.8},
        "sedan_medium": {"windshield": 1.4, "side_4": 2.4, "rear": 1.0},
        "suv": {"windshield": 1.6, "side_4": 3.0, "rear": 1.2},
        "pickup": {"windshield": 1.5, "side_4": 2.2, "rear": 0.6},
    }
    
    @classmethod
    def calculate_service_metragem(
        cls,
        vehicle_type: str,
        windows: list[str]  # ["windshield", "side_4", "rear"]
    ) -> float:
        """Calcula metragem necessária para um serviço."""
        vehicle = cls.VEHICLE_METRAGEM.get(vehicle_type, cls.VEHICLE_METRAGEM["sedan_medium"])
        return sum(vehicle.get(w, 0) for w in windows)
    
    @classmethod
    def calculate_bobbin_yield(
        cls,
        nominal_metragem: float,
        used_metragem: float,
        film_type: str
    ) -> dict:
        """
        Calcula rendimento e status da bobina.
        """
        yield_value = used_metragem / nominal_metragem if nominal_metragem > 0 else 0
        config = cls.YIELD_CONFIGS.get(film_type, YieldConfig(0.85, 0.95, 0.90))
        
        if yield_value < config.min_acceptable:
            status = "below"  # Investigar
        elif yield_value > config.max_acceptable:
            status = "above"  # Possível erro
        else:
            status = "normal"
        
        return {
            "yield": round(yield_value, 4),
            "yield_percent": round(yield_value * 100, 2),
            "status": status,
            "target": config.target,
            "min_acceptable": config.min_acceptable,
            "max_acceptable": config.max_acceptable,
        }
```

### 3.4 Módulo de Relatórios (Épico 5)

#### Dashboard Service

```python
# app/modules/reports/dashboards/executive.py
from datetime import datetime, date
from sqlalchemy import select, func
from app.db.session import AsyncSession

class ExecutiveDashboardService:
    
    @classmethod
    async def get_revenue_metrics(
        cls,
        db: AsyncSession,
        store_ids: list[int] | None = None,
        start_date: date | None = None,
        end_date: date | None = None
    ) -> dict:
        """
        Retorna métricas de faturamento para dashboard executivo.
        """
        # Query base
        query = select(
            ServiceOrderItem.department,
            func.sum(ServiceOrderItem.price).label("revenue"),
            func.count(ServiceOrderItem.id).label("count")
        ).join(ServiceOrder)
        
        # Filtros
        if store_ids:
            query = query.where(ServiceOrder.store_id.in_(store_ids))
        if start_date:
            query = query.where(ServiceOrder.entry_time >= start_date)
        if end_date:
            query = query.where(ServiceOrder.entry_time <= end_date)
        
        query = query.group_by(ServiceOrderItem.department)
        
        result = await db.execute(query)
        rows = result.fetchall()
        
        # Buscar metas
        goals = await cls._get_goals(db, store_ids, start_date, end_date)
        
        return {
            "departments": [
                {
                    "name": row.department,
                    "revenue": float(row.revenue or 0),
                    "count": row.count,
                    "goal": goals.get(row.department, 0),
                    "percentage": (
                        round(float(row.revenue or 0) / goals.get(row.department, 1) * 100, 2)
                        if goals.get(row.department) else 0
                    )
                }
                for row in rows
            ],
            "total_revenue": sum(float(r.revenue or 0) for r in rows),
            "total_count": sum(r.count for r in rows),
        }
    
    @classmethod
    async def get_comparison_with_last_year(
        cls,
        db: AsyncSession,
        store_ids: list[int] | None = None,
        current_period: tuple[date, date] | None = None
    ) -> dict:
        """
        Compara faturamento atual vs mesmo período ano anterior.
        """
        # Implementação do comparativo
        pass

class RankingService:
    
    @classmethod
    async def get_installer_ranking(
        cls,
        db: AsyncSession,
        store_ids: list[int] | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 20
    ) -> list[dict]:
        """
        Calcula ranking de instaladores por produtividade.
        
        Score = (0.4 × Quantidade Normalizada) + 
                (0.3 × Qualidade) + 
                (0.3 × Eficiência de Tempo)
        """
        # Query complexa de ranking
        # ...
        pass
```

#### PDF Generator

```python
# app/modules/reports/generators/pdf.py
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import tempfile

class PDFGenerator:
    
    def __init__(self):
        self.template_dir = Path(__file__).parent / "templates"
        self.env = Environment(loader=FileSystemLoader(str(self.template_dir)))
    
    async def generate_department_report(
        self,
        data: dict,
        department: str,
        period: tuple[date, date]
    ) -> bytes:
        """
        Gera relatório em PDF para um departamento.
        """
        template = self.env.get_template("department_report.html")
        html_content = template.render(
            data=data,
            department=department,
            period=period,
            generated_at=datetime.now()
        )
        
        css = CSS(string='''
            @page {
                size: A4;
                margin: 1.5cm;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 10pt;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .header {
                background: #003366;
                color: white;
                padding: 20px;
            }
        ''')
        
        return HTML(string=html_content).write_pdf(stylesheets=[css])
```

## 4. WebSocket para Real-time

```python
# app/websocket/manager.py
from fastapi import WebSocket
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}  # store_id -> connections
    
    async def connect(self, websocket: WebSocket, store_id: int):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = set()
        self.active_connections[store_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, store_id: int):
        self.active_connections[store_id].discard(websocket)
    
    async def broadcast_to_store(self, store_id: int, event: str, data: dict):
        """Envia evento para todos conectados de uma loja."""
        message = json.dumps({"event": event, "data": data})
        for connection in self.active_connections.get(store_id, []):
            try:
                await connection.send_text(message)
            except:
                pass  # Conexão pode ter fechado

manager = ConnectionManager()

# Endpoints WebSocket
@app.websocket("/ws/{store_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    store_id: int,
    token: str  # Validar token JWT
):
    # Validar token e permissão
    await manager.connect(websocket, store_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Processar mensagens do cliente se necessário
    except WebSocketDisconnect:
        manager.disconnect(websocket, store_id)
```

## 5. Celery Tasks

```python
# app/workers/celery_app.py
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "aems_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
    beat_schedule={
        'update-semaphores': {
            'task': 'app.workers.tasks.update_all_semaphores',
            'schedule': 30.0,  # A cada 30 segundos
        },
        'check-critical-requests': {
            'task': 'app.workers.tasks.escalate_critical_requests',
            'schedule': 3600.0,  # A cada hora
        },
        'weekly-yield-report': {
            'task': 'app.workers.tasks.generate_weekly_yield_report',
            'schedule': crontab(day_of_week=1, hour=6),  # Segunda 6h
        },
    }
)

# app/workers/tasks.py
from app.workers.celery_app import celery_app

@celery_app.task
def update_all_semaphores():
    """Atualiza cores do semáforo de todas as O.S. abertas."""
    pass

@celery_app.task
def escalate_critical_requests():
    """Escala solicitações críticas não aprovadas."""
    pass

@celery_app.task
def generate_report(report_type: str, filters: dict, user_email: str):
    """Gera relatório pesado em background e envia por email."""
    pass

@celery_app.task
def send_notification(channel: str, recipient: str, template: str, data: dict):
    """Envia notificação (email, push, etc)."""
    pass
```

## 6. Testes

### 6.1 Fixtures

```python
# tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.db.base import Base
from app.dependencies import get_db
from tests.factories import UserFactory, StoreFactory

@pytest_asyncio.fixture
async def db_session():
    """Cria banco de dados de teste."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        yield session

@pytest_asyncio.fixture
async def client(db_session):
    """Cliente HTTP para testes."""
    app.dependency_overrides[get_db] = lambda: db_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def authenticated_client(client, db_session):
    """Cliente autenticado."""
    user = await UserFactory.create(db_session)
    # Login e adicionar token ao header
    response = await client.post("/auth/login", data={
        "username": user.email,
        "password": "testpass123"
    })
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client, user
```

### 6.2 Testes de Exemplo

```python
# tests/unit/test_semaphore.py
import pytest
from datetime import datetime, timedelta
from app.modules.service_orders.semaphore import SemaphoreCalculator
from app.modules.service_orders.models import SemaphoreColor, Department

class TestSemaphoreCalculator:
    
    def test_white_color_for_recent_entry(self):
        entry = datetime.utcnow() - timedelta(minutes=10)
        color, minutes = SemaphoreCalculator.calculate(Department.FILM, entry)
        assert color == SemaphoreColor.WHITE
        assert 9 <= minutes <= 11
    
    def test_yellow_color_for_moderate_wait(self):
        entry = datetime.utcnow() - timedelta(minutes=60)
        color, _ = SemaphoreCalculator.calculate(Department.FILM, entry)
        assert color == SemaphoreColor.YELLOW
    
    def test_red_color_for_long_wait(self):
        entry = datetime.utcnow() - timedelta(hours=4)
        color, _ = SemaphoreCalculator.calculate(Department.FILM, entry)
        assert color == SemaphoreColor.RED

# tests/integration/test_service_orders.py
import pytest

class TestServiceOrderAPI:
    
    @pytest.mark.asyncio
    async def test_create_service_order(self, authenticated_client):
        client, user = authenticated_client
        
        response = await client.post("/api/v1/service-orders", json={
            "plate": "ABC1D23",
            "model": "Civic",
            "department": "film",
            "dealership_id": 1,
            "service_ids": [1, 2]
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["plate"] == "ABC1D23"
        assert data["status"] == "waiting"
    
    @pytest.mark.asyncio
    async def test_invalid_plate_format(self, authenticated_client):
        client, _ = authenticated_client
        
        response = await client.post("/api/v1/service-orders", json={
            "plate": "INVALID",
            "model": "Civic",
            "department": "film",
            "dealership_id": 1,
            "service_ids": [1]
        })
        
        assert response.status_code == 422
```

## 7. Migrations

```python
# Exemplo de migration Alembic
# alembic/versions/001_initial.py

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'stores',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(10), unique=True, nullable=False),
        sa.Column('address', sa.String(500)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('store_id', sa.Integer(), sa.ForeignKey('stores.id')),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    
    op.create_index('ix_users_email', 'users', ['email'])

def downgrade():
    op.drop_table('users')
    op.drop_table('stores')
```

---

*Especificação Backend v1.0*  
*Última atualização: Janeiro/2026*
