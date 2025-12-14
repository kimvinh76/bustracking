#!/bin/bash

echo "🔍 Testing Backend Server..."
echo ""

# Test 1: Health check
echo "1️⃣ Health Check:"
curl -s http://localhost:5000/api/health | json_pp 2>/dev/null || echo "❌ Backend not running on port 5000"
echo ""

# Test 2: Routes API
echo "2️⃣ Routes API:"
curl -s http://localhost:5000/api/routes | json_pp 2>/dev/null || echo "❌ Routes API failed"
echo ""

# Test 3: Route Stops (Route 1)
echo "3️⃣ Route 1 Stops (Quận 1):"
curl -s http://localhost:5000/api/routes/1/stops | json_pp 2>/dev/null || echo "❌ Route stops API failed"
echo ""

# Test 4: Route Stops (Route 2) 
echo "4️⃣ Route 2 Stops (Gò Vấp):"
curl -s http://localhost:5000/api/routes/2/stops | json_pp 2>/dev/null || echo "❌ Route 2 stops API failed"
echo ""

# Test 5: Driver 1 Schedules
echo "5️⃣ Driver 1 Schedules:"
curl -s http://localhost:5000/api/schedules/driver/1 | json_pp 2>/dev/null || echo "❌ Driver schedules API failed"
echo ""

echo "✅ All tests completed!"
echo ""
echo "📌 To fix WebSocket error:"
echo "   - Make sure backend is running: cd 'School Bus/backend' && npm run dev"
echo "   - Check console for: 🔌 WebSocket server đang chạy tại ws://localhost:5000"
