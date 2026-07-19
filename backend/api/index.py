from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import pandas as pd
import io
import re
from datetime import datetime

app = FastAPI(title="Inventory Intelligence SaaS API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://inventory-intelligence-saas.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://drqecfankcyfdocrlzle.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

@app.get("/")
def read_root():
    return {"message": "Inventory Intelligence SaaS API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running with Pandas support!"}

def get_supabase_client(authorization: str = Header(None)) -> Client:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(token) # Set the user token for RLS
    return client

def extract_date_from_filename(filename: str):
    # Try to find DD-MM-YYYY or YYYY-MM-DD
    match = re.search(r'(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})', filename)
    if match:
        date_str = match.group(1).replace('/', '-')
        # Attempt to parse
        try:
            # Try DD-MM-YYYY first
            if len(date_str.split('-')[0]) <= 2:
                return datetime.strptime(date_str, '%d-%m-%Y').strftime('%Y-%m-%d')
            else:
                return datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
        except ValueError:
            pass
    return None

@app.post("/api/ingest/sales")
async def ingest_sales(
    store_id: str = Form(...),
    fallback_date: str = Form(""),
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # Extract date from filename
        report_date = extract_date_from_filename(file.filename)
        if not report_date:
            report_date = fallback_date
            if not report_date:
                raise HTTPException(status_code=400, detail="لا يمكن استخراج التاريخ من اسم الملف ولم يتم توفيره كبديل")

        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Fetch Sales Mapping Template
        # First get the file_type_id for 'sales'
        ft_res = supabase.table('file_types').select('id').eq('code', 'sales').execute()
        if not ft_res.data:
            raise HTTPException(status_code=500, detail="Missing sales file type in DB")
        file_type_id = ft_res.data[0]['id']

        tpl_res = supabase.table('column_mapping_templates').select('mapping').eq('store_id', store_id).eq('file_type_id', file_type_id).execute()
        if not tpl_res.data:
            raise HTTPException(status_code=400, detail="لم يتم العثور على قالب ربط لملف المبيعات لهذا المتجر")
        
        mapping = tpl_res.data[0]['mapping']
        
        # Reverse mapping: standard_key -> user_column
        # We need to rename user_column to standard_key
        rename_map = {v: k for k, v in mapping.items() if v}

        # Check if required columns exist in CSV
        missing_cols = [v for k, v in mapping.items() if v and v not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"الأعمدة التالية مفقودة في الملف: {missing_cols}")

        df.rename(columns=rename_map, inplace=True)

        # Keep only mapped columns + drop empty SKUs
        required_cols = ['sku', 'units', 'amount']
        available_cols = [c for c in required_cols if c in df.columns]
        
        if 'sku' not in available_cols:
            raise HTTPException(status_code=400, detail="رقم المنتج (SKU) غير موجود في القالب")

        df = df.dropna(subset=['sku'])
        
        # Ensure units and amount are numeric
        if 'units' in df.columns:
            df['units'] = pd.to_numeric(df['units'], errors='coerce').fillna(0)
        else:
            df['units'] = 1 # Default

        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        else:
            df['amount'] = 0.0

        # Aggregate (Group By SKU)
        agg_funcs = {'units': 'sum', 'amount': 'sum'}
        agg_funcs = {k: v for k, v in agg_funcs.items() if k in df.columns}
        
        df_grouped = df.groupby('sku', as_index=False).agg(agg_funcs)
        
        # Prepare for DB
        df_grouped['store_id'] = store_id
        df_grouped['date'] = report_date
        
        records = df_grouped.to_dict(orient='records')
        
        # Insert into DB
        if records:
            res = supabase.table('sales_data').insert(records).execute()
        
        return {"status": "success", "message": f"تم معالجة {len(records)} منتج مبيع بتاريخ {report_date}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest/inventory")
async def ingest_inventory(
    store_id: str = Form(...),
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Fetch Inventory Mapping Template
        ft_res = supabase.table('file_types').select('id').eq('code', 'inventory').execute()
        file_type_id = ft_res.data[0]['id']

        tpl_res = supabase.table('column_mapping_templates').select('mapping').eq('store_id', store_id).eq('file_type_id', file_type_id).execute()
        if not tpl_res.data:
            raise HTTPException(status_code=400, detail="لم يتم العثور على قالب ربط لملف المخزون لهذا المتجر")
        
        mapping = tpl_res.data[0]['mapping']
        rename_map = {v: k for k, v in mapping.items() if v}

        missing_cols = [v for k, v in mapping.items() if v and v not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"الأعمدة التالية مفقودة في الملف: {missing_cols}")

        df.rename(columns=rename_map, inplace=True)
        
        if 'sku' not in df.columns:
            raise HTTPException(status_code=400, detail="رقم المنتج (SKU) غير موجود في القالب")

        df = df.dropna(subset=['sku'])
        
        if 'quantity' in df.columns:
            df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0).astype(int)
        else:
            df['quantity'] = 0

        # For inventory, if SKU is duplicated in the file, we keep the last one or sum? Sum is safer.
        df_grouped = df.groupby('sku', as_index=False).agg({'quantity': 'sum'})
        
        df_grouped['store_id'] = store_id
        
        records = df_grouped.to_dict(orient='records')
        
        # Upsert into DB (update if store_id + sku exists)
        if records:
            res = supabase.table('inventory_data').upsert(records, on_conflict="store_id, sku").execute()
        
        return {"status": "success", "message": f"تم تحديث مخزون {len(records)} منتج بنجاح"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
