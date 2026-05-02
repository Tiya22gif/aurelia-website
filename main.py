import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AURELIA API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class CartItem(BaseModel):
    id: int
    name: str
    price: float
    quantity: int

class PaymentRequest(BaseModel):
    cart: List[CartItem]
    total: float
    email: str

class ChatRequest(BaseModel):
    message: str

class ContactRequest(BaseModel):
    name: str
    email: str
    inquiry: str

# Endpoints
@app.get("/products")
async def get_products():
    return [
        {
            "id": 1,
            "name": "Obsidian Evening Gown",
            "price": 2500.00,
            "imageURL": "/static/images/product-1.jpg"
        },
        {
            "id": 2,
            "name": "Champagne Silk Blouse",
            "price": 850.00,
            "imageURL": "/static/images/product-2.jpg"
        },
        {
            "id": 3,
            "name": "Hand-Sourced Cashmere Coat",
            "price": 3200.00,
            "imageURL": "/static/images/product-3.jpg"
        },
        {
            "id": 4,
            "name": "Pure White Tailored Trousers",
            "price": 950.00,
            "imageURL": "/static/images/product-4.jpg"
        }
    ]

@app.post("/process-payment")
async def process_payment(request: PaymentRequest):
    # Simulate a 2-second processing delay
    await asyncio.sleep(2)
    return {"status": "Payment Successful", "details": f"Processed payment of ${request.total:.2f} for {request.email}"}

@app.post("/chat")
async def chat_concierge(request: ChatRequest):
    message = request.message.lower()
    
    # Sophisticated personal shopper logic
    if "material" in message or "fabric" in message or "silk" in message or "cashmere" in message:
        response = "At AURELIA, we pride ourselves on exceptional craftsmanship. Our current collection features exquisite Italian silk and hand-sourced cashmere, chosen for their unparalleled texture and drape."
    elif "price" in message or "cost" in message:
        response = "Our pieces are investment garments, reflecting the highest standards of atelier craftsmanship. May I assist you in finding a specific item?"
    elif "shipping" in message or "delivery" in message:
        response = "We offer complimentary white-glove delivery worldwide on all our garments. Your selections will arrive beautifully packaged."
    else:
        response = "Welcome to AURELIA. I am your personal concierge. How may I assist you with our collection today?"
        
    return {"response": response}

@app.post("/contact-submit")
async def contact_submit(request: ContactRequest):
    # Simulate saving inquiry
    return {"status": "success", "message": f"Thank you, {request.name}. We have received your inquiry and our concierge team will reach out shortly."}

# Mount static files (served at the root path)
import os
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")

app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
