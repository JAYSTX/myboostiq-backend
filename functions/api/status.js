// GET /api/status
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const result = await env.DB.prepare(
      'SELECT id, pair, pair_symbol, start_time, end_time, status FROM boosts ORDER BY id DESC LIMIT 1'
    ).first();
    
    if (!result) {
      return new Response(JSON.stringify({
        pair: null,
        pair_symbol: null,
        start_time: null,
        end_time: null,
        status: 'closed'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'db error', 
      detail: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

