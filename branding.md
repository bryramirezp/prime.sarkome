# Brand Identity & UI Guidelines: Deep Blue Tech

Este documento define la paleta de colores y la implementación técnica CSS para el sistema de diseño "Deep Blue Tech".

## 1. Paleta de Colores (Core Palette)
Datos exactos extraídos para garantizar la fidelidad del diseño.

| Nombre del Color | HEX | RGB | Rol Sugerido (UI Dark Theme) |
| :--- | :--- | :--- | :--- |
| **Port Gore** | `#191c38` | `rgb(25, 28, 56)` | **Fondo Global**: Base de la aplicación. |
| **Jacarta** | `#2b2d6e` | `rgb(43, 45, 110)` | **Superficie**: Tarjetas, paneles, modales. |
| **Victoria** | `#4c4e9a` | `rgb(76, 78, 154)` | **Primario**: Botones principales, estados activos. |
| **Wild Blue Yonder**| `#898ac2` | `rgb(137, 138, 194)`| **Secundario**: Bordes, iconos, subtítulos. |
| **Blue Haze** | `#c2c4e0` | `rgb(194, 196, 224)`| **Texto**: Color de fuente principal (Alto contraste). |

---

## 2. Implementación CSS (Design Tokens)
Insertar este bloque en el selector `:root` para mapear los valores crudos a variables semánticas. Esto permite una refactorización rápida y consistencia lógica.

```css
:root {
  /* --- Primitives (Valores Absolutos) --- */
  --raw-port-gore: #191c38;
  --raw-jacarta:   #2b2d6e;
  --raw-victoria:  #4c4e9a;
  --raw-wild-blue: #898ac2;
  --raw-blue-haze: #c2c4e0;

  /* --- Semantics (Uso Funcional) --- */
  
  /* Backgrounds */
  --bg-app:     var(--raw-port-gore);
  --bg-surface: var(--raw-jacarta);
  
  /* Action / Brand */
  --color-primary:       var(--raw-victoria);
  --color-primary-hover: var(--raw-wild-blue); /* Opción para hover state */
  
  /* Typography & Borders */
  --text-main:   var(--raw-blue-haze);
  --text-muted:  var(--raw-wild-blue);
  --border-ui:   rgba(137, 138, 194, 0.3); /* Wild Blue con opacidad */
}