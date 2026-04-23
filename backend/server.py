from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function for ObjectId
def str_id(doc):
    if doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

# ============ MODELS ============

class StoreCreate(BaseModel):
    name: str
    buyer_whatsapp: str = ""

class StoreResponse(BaseModel):
    id: str
    name: str
    buyer_whatsapp: str
    created_at: datetime

class ProductCreate(BaseModel):
    store_id: str
    name: str
    group: str  # Proteínas, Hortifruti, Lacticínios, Secos, Limpeza, Outros
    unit: str  # kg, un, lt, etc.
    last_purchase_price: float = 0.0
    min_stock: float = 0.0
    max_stock: float = 0.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    group: Optional[str] = None
    unit: Optional[str] = None
    last_purchase_price: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None

class ProductResponse(BaseModel):
    id: str
    store_id: str
    name: str
    group: str
    unit: str
    last_purchase_price: float
    min_stock: float
    max_stock: float
    created_at: datetime

class StockCountCreate(BaseModel):
    store_id: str
    product_id: str
    employee_name: str
    week_number: int  # 1-5
    month: int  # 1-12
    year: int
    quantity: float

class StockCountResponse(BaseModel):
    id: str
    store_id: str
    product_id: str
    employee_name: str
    week_number: int
    month: int
    year: int
    quantity: float
    created_at: datetime

class SettingsUpdate(BaseModel):
    buyer_whatsapp: str

# ============ STORE ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "De Olho no Estoque API", "status": "running"}

@api_router.post("/stores", response_model=StoreResponse)
async def create_store(store: StoreCreate):
    store_dict = store.dict()
    store_dict['created_at'] = datetime.utcnow()
    result = await db.stores.insert_one(store_dict)
    store_dict['id'] = str(result.inserted_id)
    return StoreResponse(**store_dict)

@api_router.get("/stores", response_model=List[StoreResponse])
async def get_stores():
    stores = await db.stores.find().to_list(100)
    return [StoreResponse(**str_id(store)) for store in stores]

@api_router.get("/stores/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str):
    store = await db.stores.find_one({"_id": ObjectId(store_id)})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return StoreResponse(**str_id(store))

@api_router.put("/stores/{store_id}/settings")
async def update_store_settings(store_id: str, settings: SettingsUpdate):
    result = await db.stores.update_one(
        {"_id": ObjectId(store_id)},
        {"$set": {"buyer_whatsapp": settings.buyer_whatsapp}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Settings updated successfully"}

@api_router.delete("/stores/{store_id}")
async def delete_store(store_id: str):
    # Delete store and all related data
    await db.products.delete_many({"store_id": store_id})
    await db.stock_counts.delete_many({"store_id": store_id})
    result = await db.stores.delete_one({"_id": ObjectId(store_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Store deleted successfully"}

# ============ PRODUCT ROUTES ============

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_dict['created_at'] = datetime.utcnow()
    result = await db.products.insert_one(product_dict)
    product_dict['id'] = str(result.inserted_id)
    return ProductResponse(**product_dict)

@api_router.get("/products/store/{store_id}", response_model=List[ProductResponse])
async def get_products_by_store(store_id: str):
    products = await db.products.find({"store_id": store_id}).to_list(1000)
    return [ProductResponse(**str_id(product)) for product in products]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(**str_id(product))

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_update: ProductUpdate):
    update_dict = {k: v for k, v in product_update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    return ProductResponse(**str_id(updated_product))

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    # Delete product and related stock counts
    await db.stock_counts.delete_many({"product_id": product_id})
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ============ STOCK COUNT ROUTES ============

@api_router.post("/stock-counts", response_model=StockCountResponse)
async def create_stock_count(count: StockCountCreate):
    count_dict = count.dict()
    count_dict['created_at'] = datetime.utcnow()
    
    # Check if there's already a count for this product/week/month/year
    existing = await db.stock_counts.find_one({
        "product_id": count.product_id,
        "week_number": count.week_number,
        "month": count.month,
        "year": count.year
    })
    
    if existing:
        # Update existing count
        await db.stock_counts.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "quantity": count.quantity,
                "employee_name": count.employee_name,
                "created_at": datetime.utcnow()
            }}
        )
        count_dict['id'] = str(existing['_id'])
    else:
        result = await db.stock_counts.insert_one(count_dict)
        count_dict['id'] = str(result.inserted_id)
    
    return StockCountResponse(**count_dict)

@api_router.get("/stock-counts/store/{store_id}")
async def get_stock_counts_by_store(store_id: str, week: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None):
    query = {"store_id": store_id}
    if week:
        query["week_number"] = week
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    counts = await db.stock_counts.find(query).to_list(10000)
    return [StockCountResponse(**str_id(count)) for count in counts]

@api_router.get("/stock-counts/product/{product_id}")
async def get_stock_counts_by_product(product_id: str):
    counts = await db.stock_counts.find({"product_id": product_id}).sort("created_at", -1).to_list(100)
    return [StockCountResponse(**str_id(count)) for count in counts]

# ============ ANALYTICS & REPORTS ============

@api_router.get("/analytics/store/{store_id}")
async def get_store_analytics(store_id: str, month: Optional[int] = None, year: Optional[int] = None):
    """Get comprehensive analytics for a store"""
    
    # Get all products for the store
    products = await db.products.find({"store_id": store_id}).to_list(1000)
    
    # Get stock counts
    query = {"store_id": store_id}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    stock_counts = await db.stock_counts.find(query).to_list(10000)
    
    # Build product map
    product_map = {str(p['_id']): str_id(p) for p in products}
    
    # Calculate consumption and analytics
    analytics = {
        "total_stock_value": 0.0,
        "total_consumption_value": 0.0,
        "products_below_min": [],
        "products_above_max": [],
        "low_turnover_products": [],
        "high_cost_products": [],
        "purchase_suggestions": [],
        "abc_curve": {"A": [], "B": [], "C": []},
        "consumption_by_group": {},
        "product_analytics": []
    }
    
    # Group stock counts by product
    product_counts = {}
    for count in stock_counts:
        pid = count['product_id']
        if pid not in product_counts:
            product_counts[pid] = []
        product_counts[pid].append(count)
    
    # Analyze each product
    product_consumptions = []
    
    for pid, product in product_map.items():
        counts = product_counts.get(pid, [])
        
        # Sort by week
        counts.sort(key=lambda x: (x['year'], x['month'], x['week_number']))
        
        current_stock = counts[-1]['quantity'] if counts else 0
        last_price = product.get('last_purchase_price', 0)
        min_stock = product.get('min_stock', 0)
        max_stock = product.get('max_stock', 0)
        group = product.get('group', 'Outros')
        
        # Calculate consumption (difference between consecutive counts)
        total_consumption = 0
        if len(counts) >= 2:
            for i in range(1, len(counts)):
                prev_qty = counts[i-1]['quantity']
                curr_qty = counts[i]['quantity']
                # If current is less than previous, it's consumption
                # If current is more, could be restocking (we ignore for consumption calc)
                if curr_qty < prev_qty:
                    total_consumption += (prev_qty - curr_qty)
        
        avg_consumption = total_consumption / max(len(counts) - 1, 1) if counts else 0
        consumption_value = total_consumption * last_price
        stock_value = current_stock * last_price
        
        # Add to analytics
        analytics["total_stock_value"] += stock_value
        analytics["total_consumption_value"] += consumption_value
        
        # Track by group
        if group not in analytics["consumption_by_group"]:
            analytics["consumption_by_group"][group] = 0
        analytics["consumption_by_group"][group] += consumption_value
        
        product_data = {
            "id": pid,
            "name": product['name'],
            "group": group,
            "unit": product.get('unit', 'un'),
            "current_stock": current_stock,
            "min_stock": min_stock,
            "max_stock": max_stock,
            "last_price": last_price,
            "total_consumption": total_consumption,
            "avg_consumption": avg_consumption,
            "consumption_value": consumption_value,
            "stock_value": stock_value
        }
        
        analytics["product_analytics"].append(product_data)
        product_consumptions.append((pid, consumption_value, product_data))
        
        # Check stock levels
        if current_stock < min_stock:
            analytics["products_below_min"].append(product_data)
            # Calculate purchase suggestion
            suggested_qty = max_stock - current_stock
            analytics["purchase_suggestions"].append({
                **product_data,
                "suggested_quantity": suggested_qty,
                "estimated_cost": suggested_qty * last_price
            })
        
        if max_stock > 0 and current_stock > max_stock:
            analytics["products_above_max"].append(product_data)
        
        # Low turnover (less than 10% consumption of current stock per week on average)
        if current_stock > 0 and avg_consumption > 0:
            turnover_rate = avg_consumption / current_stock
            if turnover_rate < 0.1:
                analytics["low_turnover_products"].append(product_data)
    
    # Calculate ABC Curve
    product_consumptions.sort(key=lambda x: x[1], reverse=True)
    total_consumption_value = analytics["total_consumption_value"]
    
    if total_consumption_value > 0:
        cumulative = 0
        for pid, consumption_value, product_data in product_consumptions:
            cumulative += consumption_value
            percentage = (cumulative / total_consumption_value) * 100
            
            if percentage <= 80:
                analytics["abc_curve"]["A"].append(product_data)
                analytics["high_cost_products"].append(product_data)
            elif percentage <= 95:
                analytics["abc_curve"]["B"].append(product_data)
            else:
                analytics["abc_curve"]["C"].append(product_data)
    
    # Limit high cost products to top 10
    analytics["high_cost_products"] = analytics["high_cost_products"][:10]
    
    return analytics

@api_router.get("/reports/store/{store_id}/weekly")
async def get_weekly_report(store_id: str, week: int, month: int, year: int):
    """Generate weekly report for WhatsApp"""
    
    store = await db.stores.find_one({"_id": ObjectId(store_id)})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    analytics = await get_store_analytics(store_id, month, year)
    
    # Build report message
    report_lines = [
        "📦 *Relatório de Estoque - Contagem Semanal*",
        "",
        f"🏪 *Loja:* {store['name']}",
        f"📅 *Semana:* {week} | Mês: {month}/{year}",
        "",
        "📊 *Resumo:*",
        f"• Valor total em estoque: R$ {analytics['total_stock_value']:.2f}",
        f"• Consumo estimado: R$ {analytics['total_consumption_value']:.2f}",
        ""
    ]
    
    if analytics["products_below_min"]:
        report_lines.append("⚠️ *Itens abaixo do mínimo:*")
        for p in analytics["products_below_min"][:10]:
            report_lines.append(f"• {p['name']}: {p['current_stock']:.1f} {p['unit']} (mín: {p['min_stock']:.1f})")
        report_lines.append("")
    
    if analytics["purchase_suggestions"]:
        report_lines.append("📦 *Sugestão de compra:*")
        for p in analytics["purchase_suggestions"][:10]:
            report_lines.append(f"• {p['name']}: {p['suggested_quantity']:.1f} {p['unit']} (R$ {p['estimated_cost']:.2f})")
        report_lines.append("")
    
    if analytics["low_turnover_products"]:
        report_lines.append("📉 *Itens com baixo giro:*")
        for p in analytics["low_turnover_products"][:5]:
            report_lines.append(f"• {p['name']}")
        report_lines.append("")
    
    if analytics["abc_curve"]["A"]:
        report_lines.append("🔴 *Produtos mais caros (Classe A):*")
        for p in analytics["abc_curve"]["A"][:5]:
            report_lines.append(f"• {p['name']}: R$ {p['consumption_value']:.2f}")
        report_lines.append("")
    
    # Find group with highest cost
    if analytics["consumption_by_group"]:
        top_group = max(analytics["consumption_by_group"].items(), key=lambda x: x[1])
        report_lines.append(f"📊 *Grupo com maior custo:* {top_group[0]} (R$ {top_group[1]:.2f})")
        report_lines.append("")
    
    # Auto observation
    observations = []
    if len(analytics["products_below_min"]) > 0:
        observations.append(f"⚠️ {len(analytics['products_below_min'])} produto(s) precisam de reposição urgente")
    if len(analytics["products_above_max"]) > 0:
        observations.append(f"📈 {len(analytics['products_above_max'])} produto(s) com estoque acima do máximo")
    if len(analytics["low_turnover_products"]) > 0:
        observations.append(f"📉 {len(analytics['low_turnover_products'])} produto(s) com baixo giro - avaliar necessidade")
    
    if observations:
        report_lines.append("✔️ *Observações automáticas:*")
        report_lines.extend(observations)
    
    report_lines.append("")
    report_lines.append("👨‍🍳 *Chef Felipe Matias*")
    
    return {
        "store_name": store['name'],
        "buyer_whatsapp": store.get('buyer_whatsapp', ''),
        "report_message": "\n".join(report_lines),
        "analytics": analytics
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
