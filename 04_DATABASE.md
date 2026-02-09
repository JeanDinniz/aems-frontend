# Modelo de Dados - AEMS

## 1. Diagrama Entidade-Relacionamento

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     stores      │       │     users       │       │  dealerships    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ name            │◄──────┤ store_id        │       │ name            │
│ code            │       │ email           │       │ brand           │
│ address         │       │ hashed_password │       │ store_id        │──┐
│ is_active       │       │ full_name       │       │ is_active       │  │
│ created_at      │       │ role            │       └─────────────────┘  │
└─────────────────┘       │ is_active       │              ▲             │
        ▲                 └─────────────────┘              │             │
        │                        ▲                        │             │
        │                        │                        │             │
        │   ┌────────────────────┴─────────────────────┐  │             │
        │   │          service_orders                   │  │             │
        │   ├──────────────────────────────────────────┤  │             │
        │   │ id                                        │  │             │
        └───┤ store_id                                  │  │             │
            │ order_number                              │  │             │
            │ plate                                     │  │             │
            │ model                                     │  │             │
            │ color                                     │  │             │
            │ vehicle_type                              │  │             │
            │ dealership_id ────────────────────────────┼──┘             │
            │ consultant_id                             │                │
            │ department                                │                │
            │ status                                    │                │
            │ semaphore_color                           │                │
            │ entry_time                                │                │
            │ start_time                                │                │
            │ end_time                                  │                │
            │ entry_photos (JSON)                       │                │
            │ damage_map (JSON)                         │                │
            │ invoice_number                            │                │
            │ quality_checklist (JSON)                  │                │
            │ created_by                                │                │
            │ created_at                                │                │
            └──────────────────────────────────────────┘                │
                   │           │           │                            │
                   ▼           ▼           ▼                            │
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
        │ so_items     │ │ so_workers   │ │status_history│             │
        ├──────────────┤ ├──────────────┤ ├──────────────┤             │
        │ order_id     │ │ order_id     │ │ order_id     │             │
        │ service_id   │ │ user_id      │ │ from_status  │             │
        │ film_type    │ │ is_primary   │ │ to_status    │             │
        │ film_metragem│ │ started_at   │ │ changed_by   │             │
        │ film_bobbin_id│ │ finished_at │ │ changed_at   │             │
        │ price        │ └──────────────┘ │ notes        │             │
        └──────────────┘                  └──────────────┘             │
               │                                                        │
               ▼                                                        │
        ┌──────────────┐       ┌──────────────┐       ┌─────────────────┤
        │   services   │       │ consultants  │       │                 │
        ├──────────────┤       ├──────────────┤       │                 │
        │ id           │       │ id           │       │                 │
        │ name         │       │ name         │       │                 │
        │ department   │       │ phone        │       │                 │
        │ base_price   │       │ dealership_id│───────┘                 │
        │ is_active    │       │ is_active    │                         │
        └──────────────┘       └──────────────┘                         │
                                                                        │
                                                                        │
┌─────────────────────────────────────────────────────────────────────┘
│
│  INVENTORY DOMAIN
│
│   ┌──────────────────┐       ┌──────────────────┐
│   │ purchase_requests│       │ pr_items         │
│   ├──────────────────┤       ├──────────────────┤
│   │ id               │◄──────┤ request_id       │
│   │ store_id         │       │ product_id       │
│   │ protocol         │       │ quantity         │
│   │ urgency          │       │ unit_price       │
│   │ status           │       │ received_qty     │
│   │ requested_by     │       └──────────────────┘
│   │ approved_by      │              │
│   │ approved_at      │              ▼
│   │ notes            │       ┌──────────────────┐
│   │ created_at       │       │ products         │
│   └──────────────────┘       ├──────────────────┤
│                              │ id               │
│                              │ name             │
│                              │ category         │
│                              │ unit             │
│                              │ min_stock        │
│                              └──────────────────┘
│
│   ┌──────────────────┐       ┌──────────────────┐
│   │ film_bobbins     │       │ film_consumption │
│   ├──────────────────┤       ├──────────────────┤
│   │ id               │◄──────┤ bobbin_id        │
│   │ smart_id         │       │ service_order_id │
│   │ store_id         │       │ metragem_used    │
│   │ film_type        │       │ created_at       │
│   │ nominal_metragem │       └──────────────────┘
│   │ current_metragem │
│   │ supplier         │
│   │ batch_number     │
│   │ status           │
│   │ yield_percentage │
│   │ created_at       │
│   │ finished_at      │
│   └──────────────────┘
│
│  HR DOMAIN
│
│   ┌──────────────────┐       ┌──────────────────┐
│   │ occurrences      │       │ incidents        │
│   ├──────────────────┤       ├──────────────────┤
│   │ id               │       │ id               │
│   │ employee_id      │       │ store_id         │
│   │ type             │       │ service_order_id │
│   │ date             │       │ type             │
│   │ period           │       │ description      │
│   │ is_justified     │       │ location         │
│   │ reason           │       │ photos (JSON)    │
│   │ attachment_url   │       │ responsible_id   │
│   │ registered_by    │       │ responsible_type │
│   │ created_at       │       │ estimated_value  │
│   └──────────────────┘       │ actual_value     │
│                              │ status           │
│   ┌──────────────────┐       │ registered_by    │
│   │ warnings         │       │ created_at       │
│   ├──────────────────┤       └──────────────────┘
│   │ id               │
│   │ employee_id      │
│   │ type             │
│   │ description      │
│   │ witnesses        │
│   │ attachment_url   │
│   │ signature_status │
│   │ issued_by        │
│   │ created_at       │
│   └──────────────────┘
│
│  REPORTS DOMAIN
│
│   ┌──────────────────┐       ┌──────────────────┐
│   │ monthly_goals    │       │ quality_audits   │
│   ├──────────────────┤       ├──────────────────┤
│   │ id               │       │ id               │
│   │ store_id         │       │ store_id         │
│   │ department       │       │ date             │
│   │ year_month       │       │ auditor_id       │
│   │ goal_value       │       │ checklist (JSON) │
│   │ created_at       │       │ score            │
│   └──────────────────┘       │ notes            │
│                              │ photos (JSON)    │
│                              │ created_at       │
│                              └──────────────────┘
```

## 2. Detalhamento das Tabelas

### 2.1 Domínio de Autenticação

```sql
-- Lojas
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,  -- Ex: LJ01, LJ02
    address VARCHAR(500),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'supervisor', 'operator')),
    store_id INTEGER REFERENCES stores(id),
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_role ON users(role);

-- Supervisão multi-loja
CREATE TABLE user_store_supervision (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, store_id)
);

-- Log de acessos
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,  -- login, logout, access_denied, password_change
    resource VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    success BOOLEAN DEFAULT true,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_created ON access_logs(created_at DESC);
```

### 2.2 Domínio Operacional

```sql
-- Concessionárias
CREATE TABLE dealerships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),  -- Toyota, BYD, Fiat, Hyundai
    store_id INTEGER REFERENCES stores(id),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultores
CREATE TABLE consultants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    dealership_id INTEGER REFERENCES dealerships(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Catálogo de serviços
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL CHECK (department IN ('film', 'bodywork', 'esthetics')),
    description TEXT,
    base_price DECIMAL(10,2),
    estimated_time_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ordens de Serviço
CREATE TABLE service_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,  -- LJ01-2601-00001
    
    -- Veículo
    plate VARCHAR(10) NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    vehicle_type VARCHAR(50),  -- hatch_small, sedan_medium, suv, pickup
    
    -- Relacionamentos
    store_id INTEGER NOT NULL REFERENCES stores(id),
    dealership_id INTEGER NOT NULL REFERENCES dealerships(id),
    consultant_id INTEGER REFERENCES consultants(id),
    
    -- Serviço
    department VARCHAR(50) NOT NULL CHECK (department IN ('film', 'bodywork', 'esthetics')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'waiting' 
        CHECK (status IN ('waiting', 'in_progress', 'quality_check', 'completed', 'delivered')),
    semaphore_color VARCHAR(20) DEFAULT 'white'
        CHECK (semaphore_color IN ('white', 'yellow', 'orange', 'red')),
    
    -- Tempos
    entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Documentação
    entry_photos JSONB DEFAULT '[]',  -- Array de URLs
    damage_map JSONB,  -- {points: [{x, y, type, description}]}
    
    -- Compliance
    invoice_number VARCHAR(20),
    
    -- Qualidade
    quality_checklist JSONB,
    quality_approved_by INTEGER REFERENCES users(id),
    quality_approved_at TIMESTAMP,
    
    -- Auditoria
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_invoice_for_film 
        CHECK (department != 'film' OR invoice_number IS NOT NULL OR status = 'waiting')
);

CREATE INDEX idx_so_store ON service_orders(store_id);
CREATE INDEX idx_so_plate ON service_orders(plate);
CREATE INDEX idx_so_status ON service_orders(status);
CREATE INDEX idx_so_entry_time ON service_orders(entry_time DESC);
CREATE INDEX idx_so_order_number ON service_orders(order_number);

-- Itens da O.S.
CREATE TABLE service_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    
    -- Específico película
    film_type VARCHAR(50),
    film_metragem DECIMAL(6,2),
    film_bobbin_id INTEGER,  -- Referência será criada após film_bobbins
    
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soi_order ON service_order_items(order_id);

-- Funcionários na O.S.
CREATE TABLE service_order_workers (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    is_primary BOOLEAN DEFAULT false,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    UNIQUE(order_id, user_id)
);

-- Histórico de status
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_sh_order ON status_history(order_id);
```

### 2.3 Domínio de Estoque

```sql
-- Produtos/materiais
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL 
        CHECK (category IN ('film', 'esthetics', 'machinery', 'uniforms', 'office', 'other')),
    unit VARCHAR(20) NOT NULL,  -- un, m, l, kg
    min_stock DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitações de compra
CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    protocol VARCHAR(20) UNIQUE NOT NULL,  -- SC-2601-00001
    store_id INTEGER NOT NULL REFERENCES stores(id),
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'adjustment_requested', 'ordered', 'received')),
    
    requested_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    
    justification TEXT,
    rejection_reason TEXT,
    adjustment_notes TEXT,
    
    -- Pedido formalizado
    supplier_name VARCHAR(100),
    order_date TIMESTAMP,
    expected_delivery DATE,
    payment_terms VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_pr_store ON purchase_requests(store_id);
CREATE INDEX idx_pr_status ON purchase_requests(status);
CREATE INDEX idx_pr_urgency ON purchase_requests(urgency);

-- Itens da solicitação
CREATE TABLE purchase_request_items (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity_requested DECIMAL(10,2) NOT NULL,
    quantity_approved DECIMAL(10,2),
    quantity_received DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    notes TEXT
);

-- Bobinas de película
CREATE TABLE film_bobbins (
    id SERIAL PRIMARY KEY,
    smart_id VARCHAR(20) UNIQUE NOT NULL,  -- LJ01-FUM35-2601-001
    store_id INTEGER NOT NULL REFERENCES stores(id),
    film_type VARCHAR(50) NOT NULL,
    nominal_metragem DECIMAL(6,2) NOT NULL,  -- Metragem da bobina nova
    current_metragem DECIMAL(6,2) NOT NULL,  -- Metragem restante
    supplier VARCHAR(100),
    batch_number VARCHAR(50),
    purchase_date DATE,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'finished')),
    yield_percentage DECIMAL(5,2),  -- Calculado ao finalizar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

CREATE INDEX idx_fb_store ON film_bobbins(store_id);
CREATE INDEX idx_fb_status ON film_bobbins(status);
CREATE INDEX idx_fb_smart_id ON film_bobbins(smart_id);

-- Adicionar FK em service_order_items
ALTER TABLE service_order_items 
    ADD CONSTRAINT fk_soi_bobbin 
    FOREIGN KEY (film_bobbin_id) REFERENCES film_bobbins(id);

-- Consumo de película
CREATE TABLE film_consumption (
    id SERIAL PRIMARY KEY,
    bobbin_id INTEGER NOT NULL REFERENCES film_bobbins(id),
    service_order_id INTEGER NOT NULL REFERENCES service_orders(id),
    metragem_used DECIMAL(6,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fc_bobbin ON film_consumption(bobbin_id);

-- Estoque por loja
CREATE TABLE store_inventory (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

-- Movimentações de estoque
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment')),
    quantity DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50),  -- purchase_request, service_order, manual
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_im_store_product ON inventory_movements(store_id, product_id);
```

### 2.4 Domínio de RH

```sql
-- Ocorrências (faltas)
CREATE TABLE occurrences (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('absence', 'late', 'early_leave')),
    date DATE NOT NULL,
    period VARCHAR(20),  -- full, morning, afternoon
    is_justified BOOLEAN DEFAULT false,
    reason TEXT,
    attachment_url VARCHAR(500),  -- Atestado
    registered_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date, period)
);

CREATE INDEX idx_occ_employee ON occurrences(employee_id);
CREATE INDEX idx_occ_date ON occurrences(date);

-- Advertências
CREATE TABLE warnings (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('verbal', 'written', 'suspension')),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    witnesses TEXT,  -- Nomes separados por vírgula
    attachment_url VARCHAR(500),
    
    -- Assinatura
    signature_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (signature_status IN ('pending', 'signed', 'refused')),
    signed_at TIMESTAMP,
    refusal_witnesses TEXT,
    
    document_url VARCHAR(500),  -- PDF gerado
    issued_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warn_employee ON warnings(employee_id);

-- Incidentes (danos)
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    service_order_id INTEGER REFERENCES service_orders(id),
    
    type VARCHAR(50) NOT NULL CHECK (type IN ('scratch', 'dent', 'glass_break', 'other')),
    description TEXT NOT NULL,
    location_in_store VARCHAR(100),
    photos JSONB DEFAULT '[]',
    
    -- Responsável
    responsible_type VARCHAR(20) CHECK (responsible_type IN ('employee', 'third_party', 'unknown')),
    responsible_employee_id INTEGER REFERENCES users(id),
    responsible_third_party_name VARCHAR(100),
    responsible_third_party_document VARCHAR(20),
    responsible_third_party_contact VARCHAR(100),
    unidentified_reason TEXT,
    
    witnesses TEXT,
    
    -- Valores
    estimated_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    repair_quote_url VARCHAR(500),
    
    -- Responsabilidade financeira
    financial_responsibility VARCHAR(20) 
        CHECK (financial_responsibility IN ('company', 'employee', 'third_party', 'insurance')),
    payment_installments INTEGER,
    
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution_notes TEXT,
    
    registered_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_inc_store ON incidents(store_id);
CREATE INDEX idx_inc_status ON incidents(status);
```

### 2.5 Domínio de Relatórios

```sql
-- Metas mensais
CREATE TABLE monthly_goals (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    department VARCHAR(50) NOT NULL,
    year_month VARCHAR(7) NOT NULL,  -- 2026-01
    goal_value DECIMAL(12,2) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, department, year_month)
);

-- Auditorias de qualidade
CREATE TABLE quality_audits (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    date DATE NOT NULL,
    auditor_id INTEGER NOT NULL REFERENCES users(id),
    
    checklist JSONB NOT NULL,  -- {items: [{name, score, required_photo, photo_url}]}
    overall_score DECIMAL(3,2),  -- 0.00 a 5.00
    
    notes TEXT,
    photos JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, date)
);

CREATE INDEX idx_qa_store ON quality_audits(store_id);
CREATE INDEX idx_qa_date ON quality_audits(date);

-- Cache de métricas agregadas (para performance)
CREATE TABLE metrics_cache (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,  -- daily_revenue, monthly_ranking, etc
    store_id INTEGER REFERENCES stores(id),
    date_key VARCHAR(10),  -- 2026-01-23 ou 2026-01
    data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(metric_type, store_id, date_key)
);

CREATE INDEX idx_mc_expires ON metrics_cache(expires_at);
```

## 3. Views Úteis

```sql
-- View de O.S. do dia com informações completas
CREATE OR REPLACE VIEW v_day_panel AS
SELECT 
    so.id,
    so.order_number,
    so.plate,
    so.model,
    so.color,
    so.department,
    so.status,
    so.semaphore_color,
    so.entry_time,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - so.entry_time))/60 AS wait_minutes,
    so.store_id,
    s.name AS store_name,
    d.name AS dealership_name,
    c.name AS consultant_name,
    array_agg(DISTINCT sv.name) AS services,
    array_agg(DISTINCT u.full_name) FILTER (WHERE sow.is_primary) AS primary_workers
FROM service_orders so
JOIN stores s ON so.store_id = s.id
JOIN dealerships d ON so.dealership_id = d.id
LEFT JOIN consultants c ON so.consultant_id = c.id
LEFT JOIN service_order_items soi ON so.id = soi.order_id
LEFT JOIN services sv ON soi.service_id = sv.id
LEFT JOIN service_order_workers sow ON so.id = sow.order_id
LEFT JOIN users u ON sow.user_id = u.id
WHERE so.status NOT IN ('delivered')
  AND so.entry_time::date = CURRENT_DATE
GROUP BY so.id, s.name, d.name, c.name;

-- View de ranking de instaladores
CREATE OR REPLACE VIEW v_installer_ranking AS
WITH stats AS (
    SELECT 
        sow.user_id,
        u.full_name,
        u.store_id,
        COUNT(DISTINCT so.id) AS total_services,
        AVG(EXTRACT(EPOCH FROM (so.end_time - so.start_time))/60) AS avg_time_minutes,
        SUM(soi.price) AS total_revenue,
        COUNT(CASE WHEN so.quality_checklist->>'all_passed' = 'true' THEN 1 END)::float / 
            NULLIF(COUNT(*), 0) AS quality_rate
    FROM service_order_workers sow
    JOIN service_orders so ON sow.order_id = so.id
    JOIN users u ON sow.user_id = u.id
    JOIN service_order_items soi ON so.id = soi.order_id
    WHERE so.status = 'delivered'
      AND sow.is_primary = true
      AND so.delivered_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY sow.user_id, u.full_name, u.store_id
)
SELECT 
    *,
    (0.4 * (total_services / NULLIF(AVG(total_services) OVER (PARTITION BY store_id), 0))) +
    (0.3 * quality_rate) +
    (0.3 * LEAST(1.2, 60 / NULLIF(avg_time_minutes, 0))) AS productivity_score
FROM stats;

-- View de estoque atual
CREATE OR REPLACE VIEW v_current_inventory AS
SELECT 
    si.store_id,
    s.name AS store_name,
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    si.quantity,
    p.min_stock,
    CASE 
        WHEN si.quantity <= 0 THEN 'out_of_stock'
        WHEN si.quantity <= p.min_stock THEN 'low_stock'
        ELSE 'ok'
    END AS stock_status
FROM store_inventory si
JOIN stores s ON si.store_id = s.id
JOIN products p ON si.product_id = p.id;
```

## 4. Triggers

```sql
-- Atualiza estoque automaticamente ao registrar consumo de película
CREATE OR REPLACE FUNCTION update_bobbin_metragem()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE film_bobbins
    SET current_metragem = current_metragem - NEW.metragem_used,
        status = CASE 
            WHEN current_metragem - NEW.metragem_used <= 0 THEN 'finished'
            ELSE status
        END,
        finished_at = CASE 
            WHEN current_metragem - NEW.metragem_used <= 0 THEN CURRENT_TIMESTAMP
            ELSE finished_at
        END,
        yield_percentage = CASE 
            WHEN current_metragem - NEW.metragem_used <= 0 
            THEN (nominal_metragem - (current_metragem - NEW.metragem_used)) / nominal_metragem * 100
            ELSE yield_percentage
        END
    WHERE id = NEW.bobbin_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_film_consumption_update
AFTER INSERT ON film_consumption
FOR EACH ROW
EXECUTE FUNCTION update_bobbin_metragem();

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_service_orders_updated
BEFORE UPDATE ON service_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Gera número da O.S. automaticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    store_code VARCHAR(5);
    year_month VARCHAR(4);
    seq INTEGER;
BEGIN
    SELECT code INTO store_code FROM stores WHERE id = NEW.store_id;
    year_month := TO_CHAR(CURRENT_DATE, 'YYMM');
    
    SELECT COALESCE(MAX(
        SUBSTRING(order_number FROM '[0-9]+$')::INTEGER
    ), 0) + 1 INTO seq
    FROM service_orders
    WHERE order_number LIKE store_code || '-' || year_month || '-%';
    
    NEW.order_number := store_code || '-' || year_month || '-' || LPAD(seq::TEXT, 5, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON service_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();
```

## 5. Índices de Performance

```sql
-- Índices compostos para queries frequentes
CREATE INDEX idx_so_store_status_entry ON service_orders(store_id, status, entry_time DESC);
CREATE INDEX idx_so_store_date ON service_orders(store_id, (entry_time::date));

-- Índice para busca de placa
CREATE INDEX idx_so_plate_gin ON service_orders USING gin(plate gin_trgm_ops);

-- Índice parcial para O.S. abertas
CREATE INDEX idx_so_open_orders ON service_orders(store_id, entry_time DESC) 
    WHERE status NOT IN ('delivered');

-- Índice para métricas
CREATE INDEX idx_so_delivered_month ON service_orders(store_id, department, (delivered_at::date))
    WHERE status = 'delivered';
```

## 6. Particionamento (Futuro)

```sql
-- Para tabelas de grande volume (logs, histórico)
-- Particionar por mês

-- CREATE TABLE access_logs (
--     ...
-- ) PARTITION BY RANGE (created_at);

-- CREATE TABLE access_logs_2026_01 PARTITION OF access_logs
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

*Modelo de Dados v1.0*  
*Última atualização: Janeiro/2026*
