// functions/api/admin.js
// Endpoints protegidos para administración

// CORS headers para todas las respuestas
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== env.ADMIN_TOKEN) {
    return false;
  }
  return true;
}

// Handler para OPTIONS (preflight request)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }
  
  try {
    // Obtener boost actual + whitelist
    const boost = await env.DB.prepare(
      'SELECT id, pair, pair_symbol, start_time, end_time, status FROM boosts ORDER BY id DESC LIMIT 1'
    ).first();
    
    const whitelist = await env.DB.prepare(
      'SELECT wallet_address FROM whitelist ORDER BY id DESC'
    ).all();
    
    return new Response(JSON.stringify({
      boost: boost || null,
      whitelist: whitelist.results.map(w => w.wallet_address)
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
    
  } catch (error) {
    console.error('Error in admin GET:', error);
    return new Response(JSON.stringify({ 
      error: 'db error', 
      detail: error.message 
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }
  
  try {
    const body = await request.json();
    const action = body.action;
    
    // CREAR NUEVO BOOST
    if (action === 'create_boost') {
      const { pair, pair_symbol, start_time, end_time, status } = body;
      
      const result = await env.DB.prepare(
        'INSERT INTO boosts (pair, pair_symbol, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)'
      ).bind(pair, pair_symbol || null, start_time, end_time, status || 'pre').run();
      
      return new Response(JSON.stringify({ 
        success: true, 
        id: result.meta.last_row_id 
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
    
    // ACTUALIZAR ESTADO DEL BOOST
    if (action === 'update_status') {
      const { id, status } = body;
      
      await env.DB.prepare(
        'UPDATE boosts SET status = ? WHERE id = ?'
      ).bind(status, id).run();
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
    
    // AGREGAR A WHITELIST
    if (action === 'add_whitelist') {
      const { wallet_address } = body;
      
      await env.DB.prepare(
        'INSERT OR IGNORE INTO whitelist (wallet_address) VALUES (?)'
      ).bind(wallet_address).run();
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
    
    // ELIMINAR DE WHITELIST
    if (action === 'remove_whitelist') {
      const { wallet_address } = body;
      
      await env.DB.prepare(
        'DELETE FROM whitelist WHERE wallet_address = ?'
      ).bind(wallet_address).run();
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
    
    // LIMPIAR WHITELIST
    if (action === 'clear_whitelist') {
      await env.DB.prepare('DELETE FROM whitelist').run();
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
    
    // REEMPLAZAR WHITELIST COMPLETA
    if (action === 'replace_whitelist') {
      const { wallets } = body;
      
      if (!Array.isArray(wallets)) {
        return new Response(JSON.stringify({ 
          error: 'wallets must be an array' 
        }), {
          status: 400,
          headers: CORS_HEADERS
        });
      }
      
      // Limpiar whitelist actual
      await env.DB.prepare('DELETE FROM whitelist').run();
      
      // Agregar nuevas wallets
      for (const wallet of wallets) {
        if (wallet && wallet.startsWith('0x')) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO whitelist (wallet_address) VALUES (?)'
          ).bind(wallet).run();
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true,
        count: wallets.length 
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: CORS_HEADERS
    });
    
  } catch (error) {
    console.error('Error in admin POST:', error);
    return new Response(JSON.stringify({ 
      error: 'db error', 
      detail: error.message 
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
