import sys
import py_compile

files = [
    'main.py',
    'routers/auth.py',
    'routers/transactions.py',
    'routers/debts.py',
    'routers/goals.py',
    'routers/budgets.py',
    'routers/dashboard.py',
    'routers/wallets.py',
    'schemas/auth.py',
    'schemas/debt.py',
    'schemas/goal.py',
    'schemas/transaction.py',
    'schemas/budget.py',
    'services/auth_service.py',
    'services/wallet_service.py',
    'database/connection.py',
]

errors = []
for f in files:
    try:
        py_compile.compile(f, doraise=True)
        print(f'  OK   {f}')
    except py_compile.PyCompileError as e:
        print(f'  ERR  {f}: {e}')
        errors.append(f)

print()
if errors:
    print(f'FAILED: {len(errors)} file(s) have syntax errors')
    sys.exit(1)
else:
    print('ALL FILES COMPILED SUCCESSFULLY - Backend is ready!')
