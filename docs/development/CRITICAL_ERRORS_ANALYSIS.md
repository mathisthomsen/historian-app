# 🚨 Critical TypeScript Errors - Emergency Fixes

## **Immediate Issues to Fix**

### **1. Life Events API Routes (Critical)**
The `life_events` table was removed from the schema but API routes still reference it.

**Files to fix:**
- `app/api/life-events/[id]/route.ts`
- `app/api/life-events/route.ts`
- `app/api/analytics/route.ts`
- `app/api/locations/route.ts`
- `app/api/locations/manage/route.ts`
- `app/api/projects/[id]/stats/route.ts`

### **2. Prisma Model Name Issues**
Some Prisma model names are incorrect:
- `bibliographySync` → `bibliography_syncs`
- `projects` → `project`
- `user_projects` → `userProject`

### **3. Component Props Issues**
- `DrawerNavigation` component missing `id` prop
- `RelationshipForm` component missing `open` prop
- `Grid` component missing `component` prop

## **Emergency Fix Script**

```bash
# Run this to fix the most critical issues
node scripts/fix-critical-errors.js
```

## **Manual Fixes Required**

### **1. Remove Life Events API Routes**
```bash
# These routes are no longer needed since life_events table was removed
rm -rf app/api/life-events/
```

### **2. Update Bibliography Sync**
```typescript
// In app/lib/bibliography-sync.ts
// Change all instances of:
prisma.bibliographySync
// To:
prisma.bibliography_syncs
```

### **3. Fix Project API Routes**
```typescript
// In app/api/projects/[id]/members/route.ts
// Change:
prisma.projects
// To:
prisma.project

// Change:
prisma.user_projects
// To:
prisma.userProject
```

## **Testing Strategy**

1. **Remove life events routes** (they're deprecated)
2. **Fix Prisma model names**
3. **Update component props**
4. **Run type check again**
5. **Test core functionality**

## **Priority Order**

1. **High Priority**: Remove life events API routes
2. **High Priority**: Fix Prisma model names
3. **Medium Priority**: Fix component props
4. **Low Priority**: Fix test files (can be done later) 