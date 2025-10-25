// Completely rewritten Supabase client with proper data handling
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Supabase configuration
const SUPABASE_URL = 'https://ofgrmmmsthjgtglaecsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3JtbW1zdGhqZ3RnbGFlY3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDA2MjksImV4cCI6MjA3Njg3NjYyOX0.61Qi1OC_5q-HA5zLdsfSUwV7yMd3GWQRz_BvlPAUyB4';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Data transformation functions
function transformProductFromSupabase(supabaseProduct) {
    // Fix the boolean conversion logic - be more explicit about false values
    let inStock = true; // Default to true
    if (supabaseProduct.in_stock === false || supabaseProduct.in_stock === 0 || supabaseProduct.in_stock === 'false' || supabaseProduct.in_stock === '0') {
        inStock = false;
    } else if (supabaseProduct.in_stock === true || supabaseProduct.in_stock === 1 || supabaseProduct.in_stock === 'true' || supabaseProduct.in_stock === '1') {
        inStock = true;
    }
    // If undefined/null, keep default true
    
    // Debug: Log raw Supabase data for Arabic fields
    if (supabaseProduct.id >= 25) { // Log for products we're testing
        const rawData = {
            name_ar: supabaseProduct.name_ar,
            description_ar: supabaseProduct.description_ar,
            name_en: supabaseProduct.name_en,
            description: supabaseProduct.description
        };
        console.log(`🔍 Raw Supabase data for product ID ${supabaseProduct.id}:`, JSON.stringify(rawData, null, 2));
    }
    
    const transformedProduct = {
        id: supabaseProduct.id,
        name: supabaseProduct.name_en || supabaseProduct.name || 'Unnamed Product',
        nameEn: supabaseProduct.name_en || supabaseProduct.name || '',
        nameAr: supabaseProduct.name_ar || '',
        description: supabaseProduct.description || '',
        descriptionAr: supabaseProduct.description_ar || '',
        price: Number(supabaseProduct.price) || 0,
        weight: supabaseProduct.weight || '',
        image: supabaseProduct.image_url || '',
        date: supabaseProduct.date_added || supabaseProduct.created_at,
        category: supabaseProduct.category || '',
        rating: Number(supabaseProduct.rating) || 4.5,
        inStock: inStock,
        packaging: supabaseProduct.packaging || 'jar',
        baseName: supabaseProduct.base_name || '',
        baseNameAr: supabaseProduct.base_name_ar || '',
        variantGroup: supabaseProduct.variant_group || ''
    };
    
    // Debug: Log transformed data for Arabic fields
    if (supabaseProduct.id >= 25) {
        const transformedData = {
            nameAr: transformedProduct.nameAr,
            descriptionAr: transformedProduct.descriptionAr,
            nameEn: transformedProduct.nameEn,
            description: transformedProduct.description
        };
        console.log(`🔍 Transformed data for product ID ${supabaseProduct.id}:`, JSON.stringify(transformedData, null, 2));
    }
    
    return transformedProduct;
}

function transformProductToSupabase(product) {
    return {
        name: product.nameEn || product.name || '',
        name_en: product.nameEn || product.name || '',
        name_ar: product.nameAr || '',
        description: product.description || '',
        description_ar: product.descriptionAr || '',
        price: Number(product.price) || 0,
        weight: product.weight || '',
        image_url: product.image_url || product.image || '',
        date_added: product.date || new Date().toISOString(),
        category: product.category || '',
        rating: Number(product.rating) || 4.5,
        in_stock: Boolean(product.in_stock || product.inStock),
        packaging: product.packaging || 'jar',
        base_name: product.base_name || '',
        base_name_ar: product.base_name_ar || '',
        variant_group: product.variant_group || '',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString()
    };
}

// Products operations
export async function fetchProducts() {
    try {
        console.log('🔄 Fetching products from Supabase...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Supabase error:', error);
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
            console.log('⚠️ No products found in Supabase');
            return [];
        }
        
        console.log(`✅ Fetched ${data.length} products from Supabase`);
        
        // Transform data to match expected format
        const transformedProducts = data.map(transformProductFromSupabase);
        
        // Debug: log first product
        if (transformedProducts.length > 0) {
            console.log('🔍 First product after transformation:', {
                id: transformedProducts[0].id,
                name: transformedProducts[0].name,
                price: transformedProducts[0].price,
                inStock: transformedProducts[0].inStock,
                inStockType: typeof transformedProducts[0].inStock,
                rawInStock: transformedProducts[0].rawInStock || 'N/A'
            });
        }
        
        // Debug: Check stock status for all products
        const inStockCount = transformedProducts.filter(p => p.inStock).length;
        const outOfStockCount = transformedProducts.filter(p => !p.inStock).length;
        console.log(`📊 Stock status: ${inStockCount} in stock, ${outOfStockCount} out of stock`);
        
        return transformedProducts;
        
    } catch (error) {
        console.error('💥 Error fetching products:', error);
        
        // Fallback to JSON if Supabase fails
        try {
            console.log('🔄 Falling back to JSON...');
            const response = await fetch('./data/products.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const jsonProducts = await response.json();
            console.log(`✅ Fallback: Loaded ${jsonProducts.length} products from JSON`);
            return jsonProducts;
        } catch (fallbackError) {
            console.error('❌ Both Supabase and JSON failed:', fallbackError);
            return [];
        }
    }
}

export async function createProduct(productData) {
    try {
        console.log('➕ Creating product:', productData.name);
        
        const supabaseData = transformProductToSupabase(productData);
        
        const { data, error } = await supabase
            .from('products')
            .insert([supabaseData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating product:', error);
            throw new Error(`Failed to create product: ${error.message}`);
        }
        
        console.log('✅ Product created successfully:', data.id);
        return transformProductFromSupabase(data);
        
    } catch (error) {
        console.error('💥 Error creating product:', error);
        throw error;
    }
}

export async function updateProduct(id, productData) {
    try {
        console.log('✏️ Updating product:', id);
        
        const supabaseData = transformProductToSupabase(productData);
        supabaseData.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('products')
            .update(supabaseData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating product:', error);
            throw new Error(`Failed to update product: ${error.message}`);
        }
        
        console.log('✅ Product updated successfully');
        return transformProductFromSupabase(data);
        
    } catch (error) {
        console.error('💥 Error updating product:', error);
        throw error;
    }
}

export async function deleteProduct(id) {
    try {
        console.log('🗑️ Deleting product:', id);
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('❌ Error deleting product:', error);
            throw new Error(`Failed to delete product: ${error.message}`);
        }
        
        console.log('✅ Product deleted successfully');
        return true;
        
    } catch (error) {
        console.error('💥 Error deleting product:', error);
        throw error;
    }
}

// Orders operations
export async function fetchOrders() {
    try {
        console.log('🔄 Fetching orders from Supabase...');
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error fetching orders:', error);
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }
        
        console.log(`✅ Fetched ${data?.length || 0} orders from Supabase`);
        return data || [];
        
    } catch (error) {
        console.error('💥 Error fetching orders:', error);
        return [];
    }
}

export async function createOrder(orderData) {
    try {
        console.log('📦 Creating order for:', orderData.customer_name);
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating order:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }
        
        console.log('✅ Order created successfully:', data.id);
        return data;
        
    } catch (error) {
        console.error('💥 Error creating order:', error);
        throw error;
    }
}

export async function updateOrderStatus(id, status, notes = null) {
    try {
        console.log('📝 Updating order status:', id, 'to', status);
        
        const updateData = { 
            status
        };
        
        if (notes) updateData.notes = notes;
        if (status === 'completed') updateData.completed_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating order status:', error);
            throw new Error(`Failed to update order status: ${error.message}`);
        }
        
        console.log('✅ Order status updated successfully');
        return data;
        
    } catch (error) {
        console.error('💥 Error updating order status:', error);
        throw error;
    }
}

// Storage operations
export async function uploadProductImage(file, fileName) {
    try {
        console.log('📤 Uploading image:', fileName);
        
        // Sanitize filename to remove invalid characters
        const sanitizedFileName = fileName
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars with underscore
            .replace(/\s+/g, '_') // Replace spaces with underscore
            .replace(/_+/g, '_') // Replace multiple underscores with single
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
        
        console.log('🔧 Sanitized filename:', sanitizedFileName);
        
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(sanitizedFileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });
        
        if (error) {
            console.warn('⚠️ Image upload failed:', error.message);
            // Return a placeholder image instead of throwing
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFVwbG9hZCBGYWlsZWQ8L3RleHQ+PC9zdmc+';
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(sanitizedFileName);
        
        console.log('✅ Image uploaded successfully:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('💥 Error uploading image:', error);
        // Return placeholder instead of throwing
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFVwbG9hZCBGYWlsZWQ8L3RleHQ+PC9zdmc+';
    }
}

export async function deleteProductImage(fileName) {
    try {
        const { error } = await supabase.storage
            .from('product-images')
            .remove([fileName]);
        
        if (error) {
            console.error('❌ Error deleting image:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
        
        console.log('✅ Image deleted successfully');
        return true;
        
    } catch (error) {
        console.error('💥 Error deleting image:', error);
        throw error;
    }
}

// Statistics operations
export async function getDashboardStats() {
    try {
        console.log('📊 Fetching dashboard statistics...');
        
        // Get total products
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
        
        // Get active orders
        const { count: activeOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'confirmed']);
        
        // Get total revenue
        const { data: revenueData } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'completed');
        
        const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
        
        // Get monthly revenue
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: monthlyData } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'completed')
            .gte('completed_at', `${currentMonth}-01`);
        
        const monthlyRevenue = monthlyData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
        
        // Get recent orders
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        // Get low stock products
        const { data: lowStockProducts } = await supabase
            .from('products')
            .select('*')
            .eq('in_stock', false);
        
        const stats = {
            totalProducts: totalProducts || 0,
            activeOrders: activeOrders || 0,
            totalRevenue,
            monthlyRevenue,
            recentOrders: recentOrders || [],
            lowStockProducts: lowStockProducts || []
        };
        
        console.log('✅ Dashboard stats loaded:', stats);
        return stats;
        
    } catch (error) {
        console.error('💥 Error fetching dashboard stats:', error);
        return {
            totalProducts: 0,
            activeOrders: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            recentOrders: [],
            lowStockProducts: []
        };
    }
}

// Test connection
export async function testConnection() {
    try {
        console.log('🔌 Testing Supabase connection...');
        
        const { data, error } = await supabase
            .from('products')
            .select('count')
            .limit(1);
        
        if (error) {
            throw new Error(`Connection failed: ${error.message}`);
        }
        
        console.log('✅ Supabase connection successful');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

// Initialize and test connection on load
console.log('🚀 Initializing Supabase client...');
testConnection();