#!/bin/bash

API="http://localhost:5001"

echo "Spawning test players..."

for i in {1..20}
do
curl -s -X POST $API/admin/spawn \
-H "Content-Type: application/json" \
-d "{\"nickname\":\"bot$i\",\"bullets\":5000}" > /dev/null
done

echo "Running combat simulation..."

curl -X POST $API/admin/simulate-combat \
-H "Content-Type: application/json" \
-d '{
"attacks":1000,
"maxBullets":300
}'

echo ""
echo "Simulation finished."
