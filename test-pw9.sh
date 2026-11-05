npm run start:e2e &
PID=$!
sleep 2
kill -TERM $PID
wait $PID
echo $?
