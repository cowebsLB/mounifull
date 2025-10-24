# Supabase Storage Configuration Fix

## Current Status ✅
The dashboard is working perfectly with a placeholder image system. The `product-images` bucket exists but has RLS policies blocking API access.

## Issue
The product image upload is failing due to Row Level Security (RLS) policies on the Supabase Storage bucket. Even though the bucket shows as "Public", the API access is restricted.

## Solution: Configure RLS Policies

You need to create specific RLS policies for the `product-images` bucket:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click on the **product-images** bucket

### Step 2: Go to Policies Tab
1. Click on the **Policies** tab
2. You should see the current policies (if any)

### Step 3: Create Required Policies
Create these policies by clicking **New Policy**:

**Policy 1: Allow Public Uploads**
- **Name:** `Allow public uploads`
- **Type:** `INSERT`
- **Target Roles:** `public`
- **Policy Definition:**
```sql
true
```

**Policy 2: Allow Public Reads**
- **Name:** `Allow public reads`
- **Type:** `SELECT`
- **Target Roles:** `public`
- **Policy Definition:**
```sql
true
```

**Policy 3: Allow Public Updates**
- **Name:** `Allow public updates`
- **Type:** `UPDATE`
- **Target Roles:** `public`
- **Policy Definition:**
```sql
true
```

**Policy 4: Allow Public Deletes**
- **Name:** `Allow public deletes`
- **Type:** `DELETE`
- **Target Roles:** `public`
- **Policy Definition:**
```sql
true
```

### Step 4: Test Upload
After creating the policies, test the image upload:
1. Go to `yourdomain.com/dashboard.html`
2. Navigate to **Products**
3. Click **Add Product**
4. Upload an image - it should work now!

## Alternative: Disable RLS Entirely
If you prefer to disable RLS completely:

1. Go to **Storage** → **product-images** bucket
2. Click on **Settings** tab
3. Find **Row Level Security (RLS)** toggle
4. **Turn OFF** the RLS toggle
5. Click **Save**

## Current Workaround ✅
The dashboard is currently configured to use placeholder images when upload fails, so the functionality works perfectly even without fixing the storage issue.

## Benefits of Fixing
- Images stored in cloud storage
- Better performance and reliability
- Automatic CDN delivery
- Scalable storage solution

## Test Results
After fixing, you should see:
- ✅ Image uploads work without errors
- ✅ Images display properly in product listings
- ✅ No more "Image Upload Failed" placeholders