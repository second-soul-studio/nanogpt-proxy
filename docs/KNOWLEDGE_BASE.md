# Knowledge Base

## Kill ports

Windows
```bash
## ex: netstat -ano | findstr :3000
netstat -ano | findstr :<port>

taskkill /PID <pid> /F
```