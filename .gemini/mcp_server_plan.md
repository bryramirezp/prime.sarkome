# Plan: Servidor MCP para PrimeKG → LM Studio

> **Objetivo:** Crear un servidor MCP (Model Context Protocol) que exponga el Knowledge Graph de PrimeKG como herramientas utilizables por modelos LLM en LM Studio.

## 📋 Resumen Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | MCP Server (Python) |
| **Transporte** | stdio (para LM Studio) |
| **Backend** | API FastAPI existente (GCP) |
| **Herramientas** | 7 tools biomédicas |
| **Tiempo estimado** | 2-3 horas |

---

## 🏗️ Arquitectura

```
┌─────────────┐      stdio       ┌──────────────────┐      HTTPS      ┌─────────────────┐
│  LM Studio  │ ◄──────────────► │  MCP Server      │ ◄─────────────► │  FastAPI (GCP)  │
│  (LLM)      │                  │  (Python/Local)  │                 │  Neo4j Graph    │
└─────────────┘                  └──────────────────┘                 └─────────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ .env config  │
                                  │ - API_URL    │
                                  │ - API_KEY    │
                                  └──────────────┘
```

---

## 📦 Fase 1: Setup del Proyecto MCP

### 1.1 Crear estructura de directorios

```
primekg-infra/
└── mcp-server/
    ├── src/
    │   └── primekg_mcp/
    │       ├── __init__.py
    │       ├── server.py        # MCP Server principal
    │       ├── tools.py         # Definiciones de herramientas
    │       └── api_client.py    # Cliente para FastAPI
    ├── pyproject.toml           # Configuración del paquete
    ├── requirements.txt         # Dependencias
    ├── .env.example             # Plantilla de configuración
    └── README.md                # Documentación de uso
```

### 1.2 Dependencias requeridas

```txt
mcp>=1.0.0
httpx>=0.25.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

---

## 🔧 Fase 2: Implementación del MCP Server

### 2.1 Herramientas a exponer (7 tools)

| Tool Name | Descripción | Endpoint API |
|-----------|-------------|--------------|
| `search_biomedical_entities` | Búsqueda semántica de entidades | `/search/semantic` |
| `get_entity_relationships` | Obtener vecinos de una entidad | `/neighbors/{entity}` |
| `find_connection` | Encontrar caminos entre 2 entidades | `/path/{source}/{target}` |
| `find_drug_repurposing` | Candidatos de reposicionamiento | `/hypothesis/repurposing/{disease}` |
| `find_therapeutic_targets` | Targets terapéuticos | `/hypothesis/targets/{disease}` |
| `explain_drug_mechanism` | Mecanismo droga→enfermedad | `/hypothesis/mechanisms/{drug}/{disease}` |
| `get_subgraph` | Extraer subgrafo para visualización | `/subgraph/{entity}` |

### 2.2 Implementación del servidor (server.py)

```python
# Pseudo-código de la estructura
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("primekg-mcp")

@server.list_tools()
async def list_tools():
    return [tool_definitions...]

@server.call_tool()
async def call_tool(name, arguments):
    # Delegar a FastAPI
    return await api_client.call(name, arguments)
```

### 2.3 Cliente API (api_client.py)

```python
# Pseudo-código
class PrimeKGAPIClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    async def search(self, query, limit=10):
        # GET /search/semantic?q={query}&limit={limit}
        
    async def get_neighbors(self, entity, limit=50):
        # GET /neighbors/{entity}?limit={limit}
    
    # ... etc
```

---

## ⚙️ Fase 3: Configuración para LM Studio

### 3.1 Archivo de configuración MCP

LM Studio usa un archivo de configuración JSON para servidores MCP:

```json
// %APPDATA%/LM Studio/mcp-servers.json (Windows)
{
  "servers": {
    "primekg": {
      "command": "python",
      "args": ["-m", "primekg_mcp.server"],
      "cwd": "C:/Users/Nebula/Desktop/primekg-precision-medicine-explorer/primekg-infra/mcp-server",
      "env": {
        "PRIMEKG_API_URL": "https://kg.sarkome.com"
      }
    }
  }
}
```

### 3.2 Variables de entorno necesarias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PRIMEKG_API_URL` | URL base de la API FastAPI | `https://kg.sarkome.com` |
| `PRIMEKG_API_KEY` | (No requerida actualmente) | - |

---

## 🧪 Fase 4: Testing y Validación

### 4.1 Tests unitarios

- [ ] Test de conexión a la API
- [ ] Test de cada herramienta individualmente
- [ ] Test de manejo de errores (timeout, 404, 500)
- [ ] Test de formato de respuesta MCP

### 4.2 Tests de integración

- [ ] Validar que LM Studio detecta el servidor
- [ ] Validar que las herramientas aparecen en la lista
- [ ] Probar queries reales con el LLM

### 4.3 Ejemplos de uso para validar

```
Usuario: "¿Qué drogas podrían servir para tratar sarcoma?"
LLM → MCP → find_drug_repurposing(disease="Sarcoma")

Usuario: "¿Cómo funciona el Imatinib contra la leucemia?"
LLM → MCP → explain_drug_mechanism(drug="Imatinib", disease="Leukemia")

Usuario: "Muéstrame las conexiones del gen TP53"
LLM → MCP → get_entity_relationships(entity_name="TP53")
```

---

## 📝 Fase 5: Documentación

### 5.1 README.md del servidor MCP

- Instrucciones de instalación
- Configuración de LM Studio
- Ejemplos de uso
- Troubleshooting

### 5.2 Actualizar documentación del proyecto

- Agregar sección MCP al README principal
- Diagrama de arquitectura actualizado

---

## 🗓️ Cronograma de Implementación

| Fase | Tarea | Tiempo Est. |
|------|-------|-------------|
| 1 | Setup del proyecto y dependencias | 15 min |
| 2.1 | Implementar `api_client.py` | 30 min |
| 2.2 | Implementar `tools.py` | 30 min |
| 2.3 | Implementar `server.py` | 30 min |
| 3 | Configuración LM Studio | 15 min |
| 4 | Testing | 30 min |
| 5 | Documentación | 20 min |
| **Total** | | **~2.5 horas** |

---

## ✅ Checklist de Implementación

- [ ] **Fase 1: Setup**
  - [ ] Crear estructura de directorios
  - [ ] Crear `pyproject.toml`
  - [ ] Crear `requirements.txt`
  - [ ] Crear `.env.example`

- [ ] **Fase 2: Implementación**
  - [ ] `api_client.py` - Cliente HTTP para FastAPI
  - [ ] `tools.py` - Definiciones de herramientas MCP
  - [ ] `server.py` - Servidor MCP principal
  - [ ] `__init__.py` - Exportaciones del paquete

- [ ] **Fase 3: Configuración**
  - [ ] Crear archivo de configuración para LM Studio
  - [ ] Documentar variables de entorno

- [ ] **Fase 4: Testing**
  - [ ] Test de conexión API
  - [ ] Test de cada tool
  - [ ] Integración con LM Studio

- [ ] **Fase 5: Documentación**
  - [ ] README.md del MCP server
  - [ ] Ejemplos de uso

---

## 🔗 Referencias

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [LM Studio MCP Documentation](https://lmstudio.ai/docs/mcp)
- [MCP Specification](https://spec.modelcontextprotocol.io/)

---

*Plan creado: 2026-01-21*
*Proyecto: PrimeKG Precision Medicine Explorer*
