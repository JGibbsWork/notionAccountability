# Accountability Coach - Notion API Service

A REST API service for managing accountability data in Notion databases. Handles fitness tracking, debt management, bonuses, and account balances.

## Base URL
```
http://localhost:3000
```

## Response Format
All endpoints return JSON in this format:
```json
{
  "status": "success" | "error",
  "data": {...} | null,
  "message": "error message" // only on errors
}
```

---

## 🏥 Health & Status

### `GET /health`
**Purpose**: Check if the service is running  
**Parameters**: None  
**Returns**: 
```json
{
  "status": "healthy",
  "timestamp": "2025-01-04T10:30:00.000Z"
}
```

### `GET /dashboard`
**Purpose**: Get overview of current status across all systems  
**Parameters**: None  
**Returns**:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalDebt": 150.00,
      "pendingCardioCount": 2,
      "todayWorkoutCount": 1,
      "totalPendingBonuses": 75.00,
      "hasOutstandingDebt": true
    },
    "pendingCardio": [...],
    "activeDebts": [...],
    "todayWorkouts": [...],
    "pendingBonuses": [...],
    "balances": {...}
  }
}
```

---

## 💪 Cardio Punishment System

### `POST /cardio/assign`
**Purpose**: Assign punishment cardio for violations  
**Body**:
```json
{
  "type": "treadmill" | "bike" | "run" | "stairstepper",
  "minutes": 30,
  "reason": "Missed workout" // optional
}
```
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "type": "treadmill",
    "minutes": 30,
    "status": "pending",
    "message": "30 minutes of treadmill assigned for Missed workout"
  }
}
```

### `POST /cardio/:id/complete`
**Purpose**: Mark cardio assignment as completed  
**Parameters**: 
- `id` (path): Notion page ID of cardio assignment
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "status": "completed",
    "message": "Cardio punishment completed"
  }
}
```

### `GET /cardio/pending`
**Purpose**: Get all pending cardio assignments  
**Parameters**: None  
**Returns**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "notion-page-id",
      "name": "30min Treadmill - Missed Workout",
      "type": "treadmill",
      "minutes": 30,
      "dateAssigned": "2025-01-04",
      "status": "pending"
    }
  ]
}
```

### `GET /cardio/stats?days=30`
**Purpose**: Get cardio statistics  
**Query Parameters**:
- `days` (optional): Number of days to look back (default: 30)
**Returns**:
```json
{
  "status": "success",
  "data": {
    "total": 5,
    "completed": 3,
    "pending": 1,
    "missed": 1,
    "totalMinutes": 150,
    "completedMinutes": 90,
    "completionRate": "60.0"
  }
}
```

---

## 💸 Debt Management

### `POST /debt/create`
**Purpose**: Create new debt for violations  
**Body**:
```json
{
  "amount": 50.00,
  "reason": "Unauthorized spending" // optional
}
```
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "amount": 50.00,
    "reason": "Unauthorized spending",
    "status": "active",
    "message": "Debt of $50.00 assigned for Unauthorized spending"
  }
}
```

### `POST /debt/:id/pay`
**Purpose**: Make payment toward specific debt  
**Parameters**:
- `id` (path): Notion page ID of debt
**Body**:
```json
{
  "amount": 25.00
}
```
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "paymentAmount": 25.00,
    "remainingAmount": 25.00,
    "status": "active",
    "fullyPaid": false,
    "message": "$25.00 applied. $25.00 remaining"
  }
}
```

### `GET /debt/active`
**Purpose**: Get all active debts  
**Parameters**: None  
**Returns**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "notion-page-id",
      "name": "$50.00 - Unauthorized spending",
      "originalAmount": 50.00,
      "currentAmount": 65.00,
      "interestRate": 0.30,
      "dateAssigned": "2025-01-04",
      "status": "active"
    }
  ]
}
```

### `GET /debt/total`
**Purpose**: Get total debt summary  
**Parameters**: None  
**Returns**:
```json
{
  "status": "success",
  "data": {
    "totalDebt": 165.00,
    "debtCount": 3,
    "debts": [...]
  }
}
```

---

## 🏋️ Workout Tracking

### `POST /workout/log`
**Purpose**: Log a completed workout  
**Body**:
```json
{
  "type": "Hot Yoga" | "Fitbod Lifting" | "Punishment Cardio",
  "duration": 60,
  "source": "Apple Watch" | "Manual Entry", // optional, defaults to "manual"
  "calories": 250 // optional
}
```
**Note**: Types are automatically mapped to your DB values (`Hot Yoga` → `Yoga`, etc.)

**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "type": "Yoga",
    "duration": 60,
    "source": "watch",
    "calories": 250,
    "message": "Yoga workout logged: 60 minutes"
  }
}
```

### `GET /workout/today`
**Purpose**: Get today's workouts  
**Parameters**: None  
**Returns**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "notion-page-id",
      "name": "Yoga - 60min (250 cal)",
      "type": "Yoga",
      "duration": 60,
      "calories": 250,
      "source": "watch",
      "date": "2025-01-04"
    }
  ]
}
```

### `GET /workout/week?weekStart=2025-01-01`
**Purpose**: Get workouts for a specific week  
**Query Parameters**:
- `weekStart` (optional): Start date of week (YYYY-MM-DD), defaults to current week
**Returns**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "notion-page-id",
      "name": "Yoga - 60min",
      "type": "Yoga",
      "duration": 60,
      "calories": 250,
      "source": "watch",
      "date": "2025-01-04"
    }
  ]
}
```

### `GET /workout/earnings?weekStart=2025-01-01`
**Purpose**: Calculate workout earnings for a week  
**Query Parameters**:
- `weekStart` (optional): Start date of week (YYYY-MM-DD), defaults to current week
**Returns**:
```json
{
  "status": "success",
  "data": {
    "liftingEarnings": 30.00,
    "extraYogaEarnings": 10.00,
    "totalEarnings": 40.00,
    "workoutCounts": {
      "hotYoga": 4,
      "fitbodLifting": 3,
      "punishmentCardio": 0,
      "other": 0
    },
    "perfectWeekBonus": 50.00,
    "totalWithBonus": 90.00
  }
}
```

### `GET /workout/baseline?weekStart=2025-01-01`
**Purpose**: Check if baseline yoga requirement is met  
**Query Parameters**:
- `weekStart` (optional): Start date of week (YYYY-MM-DD), defaults to current week
**Returns**:
```json
{
  "status": "success",
  "data": {
    "required": 3,
    "completed": 4,
    "compliant": true,
    "remaining": 0,
    "message": "✅ Baseline met: 4/3 yoga sessions"
  }
}
```

---

## 🎉 Bonus System

### `POST /bonus/add`
**Purpose**: Add a weekly bonus  
**Body**:
```json
{
  "type": "Perfect Week" | "Job Applications" | "AlgoExpert" | "Reading" | "Dating" | "Good Boy Bonus",
  "amount": 50.00,
  "weekOf": "2025-01-01", // optional, defaults to current week
  "description": "Extra details" // optional
}
```
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "type": "Perfect Week",
    "amount": 50.00,
    "week": "2025-01-01",
    "status": "pending",
    "message": "Perfect Week bonus of $50.00 earned for week of 2025-01-01"
  }
}
```

### `POST /bonus/:id/pay`
**Purpose**: Mark bonus as paid  
**Parameters**:
- `id` (path): Notion page ID of bonus
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "status": "paid",
    "message": "Bonus marked as paid"
  }
}
```

### `GET /bonus/pending?weekOf=2025-01-01`
**Purpose**: Get pending bonuses  
**Query Parameters**:
- `weekOf` (optional): Specific week (YYYY-MM-DD), if not provided returns all pending
**Returns**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "notion-page-id",
      "name": "Perfect Week - $50.00 (Week of 2025-01-01)",
      "type": "Perfect Week",
      "amount": 50.00,
      "weekOf": "2025-01-01",
      "status": "pending"
    }
  ]
}
```

---

## 💳 Account Balances

### `POST /balance/update`
**Purpose**: Update account balances  
**Body**:
```json
{
  "accountA": 600.00,
  "accountB": 150.00,
  "checking": 250.00
}
```
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "accountA": 600.00,
    "accountB": 150.00,
    "checking": 250.00,
    "availableTransfer": 600.00,
    "message": "Account balances updated"
  }
}
```

### `GET /balance/latest`
**Purpose**: Get most recent balance entry  
**Parameters**: None  
**Returns**:
```json
{
  "status": "success",
  "data": {
    "id": "notion-page-id",
    "date": "2025-01-04",
    "accountA": 600.00,
    "accountB": 150.00,
    "checking": 250.00,
    "availableTransfer": 600.00
  }
}
```

### `GET /balance/transfers?workoutEarnings=40&bonusEarnings=50&uberEarnings=25`
**Purpose**: Calculate available transfer amounts  
**Query Parameters**:
- `workoutEarnings` (optional): Amount earned from workouts (default: 0)
- `bonusEarnings` (optional): Amount earned from bonuses (default: 0)  
- `uberEarnings` (optional): Amount earned from Uber (default: 0)
**Returns**:
```json
{
  "status": "success",
  "data": {
    "baseAllowance": 50,
    "workoutEarnings": 40,
    "bonusEarnings": 50,
    "uberEarnings": 25,
    "totalEarnings": 165,
    "accountABalance": 600,
    "maxTransferAllowed": 165,
    "canTransferFull": true,
    "message": "$165.00 available for transfer"
  }
}
```

---

## 🔧 Quick Actions

### `POST /quick/perfect-week-bonus`
**Purpose**: Shortcut to add perfect week bonus  
**Body**:
```json
{
  "weekOf": "2025-01-01" // optional
}
```

### `POST /quick/good-boy-bonus`
**Purpose**: Add discretionary bonus  
**Body**:
```json
{
  "amount": 25.00,
  "reason": "Exceptional effort"
}
```

### `POST /quick/missed-checkin`
**Purpose**: Shortcut to assign cardio for missed check-in  
**Body**: None (assigns 20min treadmill)

---

## 🧪 Development

### Setup
```bash
npm install
cp .env.example .env
# Fill in your Notion API key and database IDs
npm start
```

### Test with Sample Data
```bash
node src/debug/check-notion.js --create-test-data
```

### Environment Variables Required
```bash
NOTION_API_KEY=your_notion_integration_token
NOTION_CARDIO_DB_ID=your_cardio_database_id
NOTION_DEBT_DB_ID=your_debt_database_id
NOTION_BALANCES_DB_ID=your_balances_database_id
NOTION_BONUSES_DB_ID=your_bonuses_database_id
NOTION_WORKOUTS_DB_ID=your_workouts_database_id
```

---

## 📝 Notes

- **Available Transfer Amount**: Always equals Account A balance (not stored separately)
- **Workout Type Mapping**: `Hot Yoga` → `Yoga`, `Fitbod Lifting` → `Lifting`
- **Source Mapping**: `Apple Watch` → `watch`, `Manual Entry` → `manual`
- **Interest Calculation**: Done in separate reconciliation service
- **All amounts**: Stored and returned as numbers (not strings)
- **Dates**: ISO format (YYYY-MM-DD) for inputs, same format returned