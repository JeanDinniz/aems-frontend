# Especificação Técnica - Frontend

## 1. Visão Geral

O frontend do AEMS é uma **Single Page Application (SPA)** construída com React 18, TypeScript e TailwindCSS, projetada para funcionar em browsers desktop, tablets e displays de TV nas lojas.

## 2. Setup do Projeto

### 2.1 Dependências Principais

```json
{
  "name": "aems-frontend",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    
    "typescript": "^5.3.0",
    
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.0",
    
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    
    "recharts": "^2.10.0",
    "@tanstack/react-table": "^8.11.0",
    
    "axios": "^1.6.0",
    "date-fns": "^3.2.0",
    "lucide-react": "^0.303.0",
    
    "react-webcam": "^7.2.0",
    "react-dropzone": "^14.2.0",
    "qrcode.react": "^3.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.41.0",
    "msw": "^2.1.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "prettier": "^3.2.0"
  }
}
```

### 2.2 Configuração do Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
```

### 2.3 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores do semáforo
        semaphore: {
          white: '#FFFFFF',
          yellow: '#FCD34D',
          orange: '#FB923C',
          red: '#EF4444',
        },
        // Brand colors
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Status colors
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
```

## 3. Estrutura de Componentes

### 3.1 UI Primitivos (Design System)

```typescript
// src/components/ui/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            {/* Spinner SVG */}
          </svg>
        )}
        {children}
      </button>
    );
  }
);

// src/components/ui/Input/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm',
            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
```

### 3.2 Componentes de Domínio

#### Service Order Card

```typescript
// src/components/domain/ServiceOrderCard/ServiceOrderCard.tsx
import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Car } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ServiceOrder, SemaphoreColor } from '@/types';

interface ServiceOrderCardProps {
  order: ServiceOrder;
  onClick?: () => void;
}

const semaphoreColors: Record<SemaphoreColor, string> = {
  white: 'bg-white border-gray-200',
  yellow: 'bg-yellow-100 border-yellow-400',
  orange: 'bg-orange-100 border-orange-400',
  red: 'bg-red-100 border-red-400 animate-pulse-slow',
};

export const ServiceOrderCard = memo(({ order, onClick }: ServiceOrderCardProps) => {
  const waitTime = formatDistanceToNow(new Date(order.entryTime), {
    locale: ptBR,
    addSuffix: false,
  });

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 p-4 shadow-sm cursor-pointer transition-transform hover:scale-102',
        semaphoreColors[order.semaphoreColor]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold">{order.plate}</span>
        <span className={cn(
          'px-2 py-1 rounded text-xs font-medium',
          order.semaphoreColor === 'red' ? 'bg-red-600 text-white' : 'bg-gray-100'
        )}>
          {order.status}
        </span>
      </div>

      {/* Vehicle Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Car className="h-4 w-4" />
        <span>{order.model}</span>
        {order.color && <span className="text-gray-400">• {order.color}</span>}
      </div>

      {/* Service */}
      <div className="text-sm mb-3">
        {order.services.map((s) => s.name).join(', ')}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Aguardando há {waitTime}</span>
        </div>
        {order.consultantName && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{order.consultantName}</span>
          </div>
        )}
      </div>

      {/* Critical Alert */}
      {order.semaphoreColor === 'red' && (
        <div className="mt-2 p-2 bg-red-600 text-white text-xs rounded text-center">
          ⚠️ ATENÇÃO URGENTE
        </div>
      )}
    </div>
  );
});
```

#### Painel Semáforo

```typescript
// src/components/domain/SemaphorePanel/SemaphorePanel.tsx
import { useMemo } from 'react';
import { ServiceOrderCard } from '../ServiceOrderCard';
import type { ServiceOrder, SemaphoreColor } from '@/types';

interface SemaphorePanelProps {
  orders: ServiceOrder[];
  onOrderClick: (order: ServiceOrder) => void;
}

const STATUS_COLUMNS = [
  { key: 'waiting', label: 'Aguardando', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'Em Andamento', color: 'bg-blue-100' },
  { key: 'quality_check', label: 'Inspeção', color: 'bg-purple-100' },
  { key: 'completed', label: 'Pronto', color: 'bg-green-100' },
] as const;

export function SemaphorePanel({ orders, onOrderClick }: SemaphorePanelProps) {
  // Agrupar por status
  const groupedOrders = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = orders
        .filter((o) => o.status === col.key)
        .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
      return acc;
    }, {} as Record<string, ServiceOrder[]>);
  }, [orders]);

  // Contadores
  const counters = useMemo(() => {
    const colors: Record<SemaphoreColor, number> = {
      white: 0,
      yellow: 0,
      orange: 0,
      red: 0,
    };
    orders.forEach((o) => {
      colors[o.semaphoreColor]++;
    });
    return colors;
  }, [orders]);

  return (
    <div className="h-full flex flex-col">
      {/* Header com contadores */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-xl font-bold">Painel de Carros do Dia</h1>
        <div className="flex gap-4">
          <Counter color="white" count={counters.white} label="OK" />
          <Counter color="yellow" count={counters.yellow} label="Atenção" />
          <Counter color="orange" count={counters.orange} label="Alerta" />
          <Counter color="red" count={counters.red} label="Crítico" />
        </div>
      </div>

      {/* Colunas Kanban */}
      <div className="flex-1 grid grid-cols-4 gap-4 p-4 overflow-hidden">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className={cn('p-2 rounded-t font-medium text-center', col.color)}>
              {col.label}
              <span className="ml-2 text-gray-500">
                ({groupedOrders[col.key]?.length || 0})
              </span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-b p-2 overflow-y-auto space-y-2">
              {groupedOrders[col.key]?.map((order) => (
                <ServiceOrderCard
                  key={order.id}
                  order={order}
                  onClick={() => onOrderClick(order)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Counter({ color, count, label }: { 
  color: SemaphoreColor; 
  count: number; 
  label: string;
}) {
  const bgColors: Record<SemaphoreColor, string> = {
    white: 'bg-white border',
    yellow: 'bg-yellow-400',
    orange: 'bg-orange-400',
    red: 'bg-red-500 text-white',
  };

  return (
    <div className={cn('px-3 py-1 rounded flex items-center gap-2', bgColors[color])}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
```

#### Mapa de Avarias

```typescript
// src/components/domain/DamageMap/DamageMap.tsx
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';

interface DamagePoint {
  id: string;
  x: number;  // 0-1 relativo
  y: number;  // 0-1 relativo
  type: DamageType;
  description?: string;
}

type DamageType = 'scratch' | 'dent' | 'crack' | 'stain' | 'other';

const DAMAGE_ICONS: Record<DamageType, { icon: string; color: string }> = {
  scratch: { icon: '—', color: 'bg-red-500' },
  dent: { icon: '○', color: 'bg-orange-500' },
  crack: { icon: '✕', color: 'bg-purple-500' },
  stain: { icon: '●', color: 'bg-yellow-500' },
  other: { icon: '?', color: 'bg-gray-500' },
};

interface DamageMapProps {
  damages: DamagePoint[];
  onDamageAdd: (damage: Omit<DamagePoint, 'id'>) => void;
  onDamageRemove: (id: string) => void;
  readOnly?: boolean;
}

export function DamageMap({ damages, onDamageAdd, onDamageRemove, readOnly }: DamageMapProps) {
  const [selectedType, setSelectedType] = useState<DamageType>('scratch');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    onDamageAdd({ x, y, type: selectedType });
  }, [selectedType, onDamageAdd, readOnly]);

  return (
    <div className="space-y-4">
      {/* Seletor de tipo */}
      {!readOnly && (
        <div className="flex gap-2">
          {Object.entries(DAMAGE_ICONS).map(([type, { icon, color }]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as DamageType)}
              className={cn(
                'px-3 py-2 rounded flex items-center gap-2',
                selectedType === type ? 'ring-2 ring-blue-500' : 'opacity-60'
              )}
            >
              <span className={cn('w-6 h-6 rounded-full text-white flex items-center justify-center', color)}>
                {icon}
              </span>
              <span className="text-sm capitalize">{type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mapa do veículo */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative aspect-[2/1] border-2 border-gray-300 rounded-lg bg-gray-100 cursor-crosshair"
        style={{
          backgroundImage: 'url(/assets/vehicle-map/car-top-view.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* Marcadores de avarias */}
        {damages.map((damage) => {
          const { icon, color } = DAMAGE_ICONS[damage.type];
          return (
            <div
              key={damage.id}
              className={cn(
                'absolute w-6 h-6 rounded-full text-white flex items-center justify-center',
                'transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                color
              )}
              style={{
                left: `${damage.x * 100}%`,
                top: `${damage.y * 100}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!readOnly) onDamageRemove(damage.id);
              }}
              title={damage.description || damage.type}
            >
              {icon}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="text-sm text-gray-500">
        {readOnly 
          ? `${damages.length} avaria(s) registrada(s)` 
          : 'Clique no veículo para marcar avarias'}
      </div>
    </div>
  );
}
```

#### Photo Capture

```typescript
// src/components/domain/PhotoCapture/PhotoCapture.tsx
import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PhotoCaptureProps {
  onCapture: (photo: File) => void;
  label?: string;
  guide?: string;  // Ex: "Foto frontal"
}

export function PhotoCapture({ onCapture, label, guide }: PhotoCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
    }
  }, []);

  const confirm = useCallback(async () => {
    if (!preview) return;

    // Converter base64 para File
    const response = await fetch(preview);
    const blob = await response.blob();
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    onCapture(file);
    setPreview(null);
    setIsCapturing(false);
  }, [preview, onCapture]);

  const retake = useCallback(() => {
    setPreview(null);
  }, []);

  if (!isCapturing) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsCapturing(true)}
        className="w-full h-32 flex flex-col items-center justify-center border-dashed"
      >
        <Camera className="h-8 w-8 mb-2" />
        <span>{label || 'Tirar Foto'}</span>
        {guide && <span className="text-sm text-gray-500">{guide}</span>}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="w-full rounded-lg" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={retake} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tirar novamente
            </Button>
            <Button onClick={confirm} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.8}
              className="w-full rounded-lg"
              videoConstraints={{
                facingMode: 'environment',  // Câmera traseira em mobile
              }}
            />
            {guide && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/50 text-white px-3 py-1 rounded">
                  {guide}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCapturing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={capture} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Capturar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

## 4. State Management

### 4.1 Auth Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  updateTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, { accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

### 4.2 Store Selector (Multi-loja)

```typescript
// src/stores/storeStore.ts
import { create } from 'zustand';
import type { Store } from '@/types';

interface StoreState {
  availableStores: Store[];
  selectedStoreId: number | null;
  isMultiStore: boolean;
  
  setAvailableStores: (stores: Store[]) => void;
  selectStore: (storeId: number | null) => void;
}

export const useStoreStore = create<StoreState>()((set) => ({
  availableStores: [],
  selectedStoreId: null,
  isMultiStore: false,

  setAvailableStores: (stores) =>
    set({
      availableStores: stores,
      isMultiStore: stores.length > 1,
      selectedStoreId: stores.length === 1 ? stores[0].id : null,
    }),

  selectStore: (storeId) => set({ selectedStoreId: storeId }),
}));
```

## 5. API Services

### 5.1 API Client

```typescript
// src/config/api.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adicionar token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { refreshToken, updateTokens, logout } = useAuthStore.getState();
      
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          
          updateTokens({
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          });
          
          return api(originalRequest);
        } catch {
          logout();
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 5.2 Service Order Service

```typescript
// src/services/serviceOrder.service.ts
import api from '@/config/api';
import type { 
  ServiceOrder, 
  ServiceOrderCreate, 
  StatusUpdate,
  PaginatedResponse 
} from '@/types';

export const serviceOrderService = {
  list: async (params: {
    storeId?: number;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ServiceOrder>> => {
    const { data } = await api.get('/service-orders', { params });
    return data;
  },

  getDayPanel: async (storeId: number, date?: string): Promise<ServiceOrder[]> => {
    const { data } = await api.get(`/service-orders/day-panel/${storeId}`, {
      params: { date },
    });
    return data;
  },

  getById: async (id: number): Promise<ServiceOrder> => {
    const { data } = await api.get(`/service-orders/${id}`);
    return data;
  },

  create: async (payload: ServiceOrderCreate): Promise<ServiceOrder> => {
    const { data } = await api.post('/service-orders', payload);
    return data;
  },

  updateStatus: async (id: number, payload: StatusUpdate): Promise<ServiceOrder> => {
    const { data } = await api.patch(`/service-orders/${id}/status`, payload);
    return data;
  },

  uploadPhoto: async (id: number, photo: File): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', photo);
    
    const { data } = await api.post(`/service-orders/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};
```

### 5.3 React Query Hooks

```typescript
// src/hooks/useServiceOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderService } from '@/services/serviceOrder.service';
import { useStoreStore } from '@/stores/storeStore';
import { toast } from '@/hooks/useToast';

export function useDayPanel(date?: string) {
  const { selectedStoreId } = useStoreStore();
  
  return useQuery({
    queryKey: ['day-panel', selectedStoreId, date],
    queryFn: () => serviceOrderService.getDayPanel(selectedStoreId!, date),
    enabled: !!selectedStoreId,
    refetchInterval: 30000,  // Atualiza a cada 30s
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serviceOrderService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-panel'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast({ title: 'O.S. criada com sucesso', variant: 'success' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao criar O.S.', 
        description: error.message,
        variant: 'error' 
      });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StatusUpdate }) =>
      serviceOrderService.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-panel'] });
    },
  });
}
```

## 6. WebSocket Integration

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useStoreStore } from '@/stores/storeStore';

interface WSEvent {
  event: string;
  data: any;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const { selectedStoreId } = useStoreStore();

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const { event: eventType, data }: WSEvent = JSON.parse(event.data);
      
      switch (eventType) {
        case 'os_status_changed':
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: ['day-panel'] });
          queryClient.invalidateQueries({ queryKey: ['service-orders', data.os_id] });
          break;
          
        case 'semaphore_update':
          // Atualizar apenas o card específico no cache
          queryClient.setQueryData(['day-panel', selectedStoreId], (old: any[]) =>
            old?.map((order) =>
              order.id === data.os_id
                ? { ...order, semaphoreColor: data.color, waitTime: data.wait_time }
                : order
            )
          );
          break;
          
        case 'new_purchase_request':
          queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
          // Mostrar notificação se urgente
          if (data.urgency === 'critical') {
            // toast...
          }
          break;
      }
    } catch (e) {
      console.error('WS message parse error:', e);
    }
  }, [queryClient, selectedStoreId]);

  useEffect(() => {
    if (!accessToken || !selectedStoreId) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/ws/${selectedStoreId}?token=${accessToken}`;

    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = handleMessage;
    ws.current.onclose = () => {
      // Reconectar após 5 segundos
      setTimeout(() => {
        // Retry logic
      }, 5000);
    };

    return () => {
      ws.current?.close();
    };
  }, [accessToken, selectedStoreId, handleMessage]);
}
```

## 7. Routing & Guards

```typescript
// src/config/routes.tsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';

// Pages
import { Login } from '@/pages/auth/Login';
import { DayPanel } from '@/pages/service-orders/DayPanel';
import { CreateOS } from '@/pages/service-orders/Create';
// ... outras páginas

// Guard para rotas protegidas
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

// Guard baseado em role
function RoleGuard({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuthStore();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
}

export const router = createBrowserRouter([
  // Rotas públicas
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },
  
  // Rotas protegidas
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Dashboard - todos
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },
          
          // Operacional - operador+
          {
            element: <RoleGuard allowedRoles={['operator', 'supervisor', 'owner']} />,
            children: [
              { path: '/day-panel', element: <DayPanel /> },
              { path: '/service-orders/new', element: <CreateOS /> },
              { path: '/service-orders/:id', element: <OSDetail /> },
            ],
          },
          
          // Aprovações - supervisor+
          {
            element: <RoleGuard allowedRoles={['supervisor', 'owner']} />,
            children: [
              { path: '/purchase-requests', element: <PurchaseRequests /> },
              { path: '/approvals', element: <Approvals /> },
            ],
          },
          
          // Admin - owner only
          {
            element: <RoleGuard allowedRoles={['owner']} />,
            children: [
              { path: '/admin/users', element: <UserManagement /> },
              { path: '/admin/stores', element: <StoreManagement /> },
              { path: '/reports/bi', element: <BIDashboard /> },
            ],
          },
        ],
      },
    ],
  },
  
  // 404
  { path: '*', element: <NotFound /> },
]);
```

## 8. Forms & Validation

```typescript
// src/pages/service-orders/Create.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateServiceOrder } from '@/hooks/useServiceOrders';

const createOSSchema = z.object({
  plate: z
    .string()
    .min(7, 'Placa inválida')
    .max(8)
    .transform((v) => v.toUpperCase().replace('-', ''))
    .refine(
      (v) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(v),
      'Formato de placa inválido'
    ),
  model: z.string().min(2, 'Modelo obrigatório'),
  color: z.string().optional(),
  vehicleType: z.enum(['hatch_small', 'sedan_medium', 'suv', 'pickup']).optional(),
  department: z.enum(['film', 'bodywork', 'esthetics']),
  dealershipId: z.number({ required_error: 'Concessionária obrigatória' }),
  consultantId: z.number().optional(),
  serviceIds: z.array(z.number()).min(1, 'Selecione pelo menos um serviço'),
});

type CreateOSFormData = z.infer<typeof createOSSchema>;

export function CreateOS() {
  const { mutate: createOS, isPending } = useCreateServiceOrder();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOSFormData>({
    resolver: zodResolver(createOSSchema),
  });

  const department = watch('department');

  const onSubmit = (data: CreateOSFormData) => {
    createOS(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Placa */}
      <Input
        label="Placa do Veículo"
        {...register('plate')}
        error={errors.plate?.message}
        placeholder="ABC1D23"
      />

      {/* Modelo */}
      <Input
        label="Modelo"
        {...register('model')}
        error={errors.model?.message}
      />

      {/* Departamento */}
      <Select
        label="Departamento"
        {...register('department')}
        error={errors.department?.message}
      >
        <option value="">Selecione...</option>
        <option value="film">Película</option>
        <option value="bodywork">Funilaria</option>
        <option value="esthetics">Estética</option>
      </Select>

      {/* Serviços - filtrados por departamento */}
      {department && (
        <ServiceSelector
          department={department}
          selectedIds={watch('serviceIds') || []}
          onChange={(ids) => setValue('serviceIds', ids)}
          error={errors.serviceIds?.message}
        />
      )}

      {/* ... outros campos */}

      <Button type="submit" isLoading={isPending}>
        Criar O.S.
      </Button>
    </form>
  );
}
```

## 9. Testes

### 9.1 Component Tests

```typescript
// src/components/domain/ServiceOrderCard/ServiceOrderCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceOrderCard } from './ServiceOrderCard';

const mockOrder = {
  id: 1,
  orderNumber: 'OS-001',
  plate: 'ABC1D23',
  model: 'Civic',
  status: 'waiting',
  semaphoreColor: 'yellow' as const,
  entryTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min atrás
  services: [{ name: 'Película Total' }],
  consultantName: 'João',
  dealershipName: 'Honda Centro',
};

describe('ServiceOrderCard', () => {
  it('renders order information', () => {
    render(<ServiceOrderCard order={mockOrder} />);
    
    expect(screen.getByText('ABC1D23')).toBeInTheDocument();
    expect(screen.getByText('Civic')).toBeInTheDocument();
    expect(screen.getByText('Película Total')).toBeInTheDocument();
  });

  it('applies correct color class for semaphore', () => {
    const { container } = render(<ServiceOrderCard order={mockOrder} />);
    
    expect(container.firstChild).toHaveClass('bg-yellow-100');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<ServiceOrderCard order={mockOrder} onClick={handleClick} />);
    
    await userEvent.click(screen.getByText('ABC1D23'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows critical alert for red orders', () => {
    const criticalOrder = { ...mockOrder, semaphoreColor: 'red' as const };
    render(<ServiceOrderCard order={criticalOrder} />);
    
    expect(screen.getByText('⚠️ ATENÇÃO URGENTE')).toBeInTheDocument();
  });
});
```

### 9.2 E2E Tests (Playwright)

```typescript
// e2e/service-orders.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Service Orders', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'operador@teste.com');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new service order', async ({ page }) => {
    await page.goto('/service-orders/new');
    
    // Preencher formulário
    await page.fill('[name="plate"]', 'ABC1D23');
    await page.fill('[name="model"]', 'Civic');
    await page.selectOption('[name="department"]', 'film');
    
    // Aguardar serviços carregar
    await page.waitForSelector('[data-testid="service-checkbox"]');
    await page.click('[data-testid="service-checkbox"]:first-child');
    
    // Selecionar concessionária
    await page.selectOption('[name="dealershipId"]', '1');
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Verificar sucesso
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page).toHaveURL(/\/day-panel/);
  });

  test('should display day panel with orders', async ({ page }) => {
    await page.goto('/day-panel');
    
    // Verificar colunas
    await expect(page.getByText('Aguardando')).toBeVisible();
    await expect(page.getByText('Em Andamento')).toBeVisible();
    await expect(page.getByText('Pronto')).toBeVisible();
    
    // Verificar que há pelo menos um card
    await expect(page.locator('[data-testid="os-card"]')).toHaveCount({ min: 1 });
  });
});
```

---

*Especificação Frontend v1.0*  
*Última atualização: Janeiro/2026*
