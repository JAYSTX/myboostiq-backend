// functions/api/admin.js
// Endpoints protegidos para administración

function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== env.ADMIN_TOKEN) {
    return false;
  }
  return true;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in admin GET:', error);
    return new Response(JSON.stringify({ 
      error: 'db error', 
      detail: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ACTUALIZAR ESTADO DEL BOOST
    if (action === 'update_status') {
      const { id, status } = body;
      
      await env.DB.prepare(
        'UPDATE boosts SET status = ? WHERE id = ?'
      ).bind(status, id).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // AGREGAR A WHITELIST
    if (action === 'add_whitelist') {
      const { wallet_address } = body;
      
      await env.DB.prepare(
        'INSERT OR IGNORE INTO whitelist (wallet_address) VALUES (?)'
      ).bind(wallet_address).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ELIMINAR DE WHITELIST
    if (action === 'remove_whitelist') {
      const { wallet_address } = body;
      
      await env.DB.prepare(
        'DELETE FROM whitelist WHERE wallet_address = ?'
      ).bind(wallet_address).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // LIMPIAR WHITELIST
    if (action === 'clear_whitelist') {
      await env.DB.prepare('DELETE FROM whitelist').run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in admin POST:', error);
    return new Response(JSON.stringify({ 
      error: 'db error', 
      detail: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
