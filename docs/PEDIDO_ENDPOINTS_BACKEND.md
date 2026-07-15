# Pedido de endpoints — Panel Super Admin

Fecha: 2026-07-14  
Base: `/api/v1/` · Rol: `super_admin`

## Contexto

El front ya consume los endpoints admin existentes:

- `GET /admin/control-pagos/`
- `GET /admin/auditoria/` + `/indicadores/`
- `GET /admin/adelantos/historial/`
- `POST /empresas/{id}/suspender/` / `reactivar/`

Para completar módulos que hoy no tienen contrato, se requieren los siguientes.

---

## 1. Alta — Listado de empleados por empresa (Nómina)

**Pantalla:** Empresas → ver nómina / detalle empleados

Hoy `GET /empleados/` es solo rol `empresa` (403 para super_admin).

### Propuesta

```
GET /api/v1/empleados/admin/?empresa_id=<uuid>&page=&page_size=
```

**Auth:** Bearer · `IsSuperAdmin`  
**Query:** `empresa_id` (obligatorio)

### Respuesta sugerida (200)

```json
{
  "count": 12,
  "page": 1,
  "page_size": 50,
  "results": [
    {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "documento": "1234567890",
      "email": "juan@correo.com",
      "salario": "2500000.00",
      "estado": "activo",
      "banco_nombre": "Bancolombia",
      "tipo_cuenta": "ahorros",
      "numero_cuenta": "123456789",
      "tipo_contrato": "indefinido",
      "empresa_id": "uuid",
      "created_at": "..."
    }
  ]
}
```

---

## 2. Media — Cuentas de cobro / facturación (si el producto las mantiene)

El UI antiguo simulaba: crear cuenta por periodo, adjuntar PDF, verificar/rechazar evidencia.

`GET /admin/control-pagos/` solo entrega **totales mensuales por empresa**, no el workflow documental.

### Si se necesita el flujo documental

| Método | Ruta sugerida | Uso |
|--------|---------------|-----|
| `GET` | `/admin/cuentas-cobro/?mes=&anio=&empresa_id=` | Listar cuentas del periodo |
| `POST` | `/admin/cuentas-cobro/` | Crear cuenta (empresa + periodo) |
| `POST` | `/admin/cuentas-cobro/{id}/documento/` | Subir PDF/excel (multipart) |
| `POST` | `/admin/cuentas-cobro/{id}/verificar/` | Marcar verificada |
| `POST` | `/admin/cuentas-cobro/{id}/rechazar/` | Rechazar con motivo |

Si **no** se va a construir ese flujo, confirmen que Control de pagos = solo el resumen de `/admin/control-pagos/` y cerramos el alcance.

---

## 3. Baja — Mejoras opcionales

| Método | Ruta | Uso |
|--------|------|-----|
| `PATCH` | `/empresas/{id}/` | Editar `nombre`, `nit`, `dia_pago_nomina` |
| `POST` | `/users/{id}/reactivar/` | Reactivar usuario tras `DELETE` (desactivar) |
| Query | `GET /admin/auditoria/?accion=&empresa_id=` | Filtros que el UI tenía en mock |

---

## Checklist de respuesta backend

- [ ] `GET /empleados/admin/?empresa_id=`
- [ ] Confirmar alcance: ¿cuentas de cobro documentales o solo control-pagos agregado?
- [ ] (Opcional) `PATCH /empresas/{id}/`
- [ ] (Opcional) reactivar usuario
- [ ] (Opcional) filtros extra en auditoría
