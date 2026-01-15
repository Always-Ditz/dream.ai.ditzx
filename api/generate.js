// api/generate.js
import crypto from 'crypto';

const BASE = 'https://tools.dreamfaceapp.com/dw-server';

const MODELS = [
  {
    id: 1,
    name: "Seedream 4.5",
    desc: "Mastering any style with exceptional prompt understanding.",
    param: {
      model: "see-dream-45",
      template_id: "WEB-SEE_DREAM_45",
      releation_id: "ri05016",
      play_types: ["SEE_DREAM_45", "TEXT_TO_IMAGE"],
      output: { count: 1, width: 2560, height: 1920, resolution: "2K", ratio: "4:3" }
    }
  },
  {
    id: 2,
    name: "Nano Banana Pro",
    desc: "Google's flagship model for high-quality generation.",
    param: {
      model: "gemini3",
      template_id: "WEB-NANO_PRO",
      releation_id: "ri05015",
      play_types: ["NANO_PRO", "TEXT_TO_IMAGE"],
      output: { count: 1, width: 1280, height: 960, resolution: "1K", ratio: "4:3" }
    }
  },
  {
    id: 3,
    name: "Illustrious-SDXL",
    desc: "Specialized anime model, optimized for illustration.",
    param: {
      model: "anime",
      template_id: "WEB-ANIME",
      releation_id: "ri05006",
      play_types: ["AIGC", "ANIME", "TEXT_TO_IMAGE"],
      output: { count: 1, width: 1280, height: 960, resolution: "1K", ratio: "4:3" }
    }
  },
  {
    id: 4,
    name: "Seedream 4.0",
    desc: "Delivering high-resolution output from multiple images.",
    param: {
      model: "see-dream",
      template_id: "WEB-SEE_DREAM",
      releation_id: "ri05004",
      play_types: ["SEE_DREAM", "TEXT_TO_IMAGE"],
      output: { count: 1, width: 1280, height: 960, resolution: "1K", ratio: "4:3" }
    }
  },
  {
    id: 5,
    name: "Nano Banana",
    desc: "Google's powerful AI model with strong consistency.",
    param: {
      model: "gemini",
      template_id: "WEB-NANO_BANANA",
      releation_id: "ri05010",
      play_types: ["NANO", "TEXT_TO_IMAGE"],
      output: { count: 1, width: 1024, height: 1024, resolution: "1K", ratio: "1:1" }
    }
  },
  {
    id: 6,
    name: "Flux Kontext Pro",
    desc: "Stronger image consistency and editing.",
    param: {
      model: "flux-kontext-pro",
      template_id: "WEB-BFL",
      releation_id: "ri05013",
      play_types: ["BFL", "TEXT_TO_IMAGE"],
      output: { count: 1, width: 1024, height: 1024, resolution: "1K", ratio: "1:1" }
    }
  }
];

const baseHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
  'origin': 'https://tools.dreamfaceapp.com',
  'referer': 'https://tools.dreamfaceapp.com/',
};

const rnd = n => crypto.randomBytes(n).toString('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function post(url, body, token, clientId) {
  const headers = { ...baseHeaders };
  if (token) headers['token'] = token;
  if (clientId) headers['client-id'] = clientId;

  const res = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  });
  
  const j = await res.json();
  if (j.status_code && j.status_code !== 'THS12140000000') throw new Error(j.status_msg || 'API Error');
  return j.data || j;
}

export default async function handler(req, res) {
  // Hanya menerima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, modelId } = req.body;

  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Missing prompt or modelId' });
  }

  const selectedModel = MODELS.find(m => m.id == modelId);
  if (!selectedModel) {
    return res.status(400).json({ error: 'Invalid Model ID' });
  }

  try {
    const email = `df_${rnd(5)}@illubd.com`;
    const userId = rnd(16);
    const clientId = rnd(16);

    // 1. Login
    const login = await post(`${BASE}/user/login`, {
      password: 'dancow000',
      user_id: userId,
      third_id: email,
      third_platform: 'EMAIL',
      register_source: 'seo',
      platform_type: 'MOBILE',
      tenant_name: 'dream_face',
      platformType: 'MOBILE',
      tenantName: 'dream_face'
    }, null, clientId);

    // 2. Save Login
    await post(`${BASE}/user/save_user_login`, {
      device_system: 'PC-Mobile',
      device_name: 'PC-Mobile',
      user_id: userId,
      account_id: login.account_id,
      app_version: '4.7.1',
      time_zone: 7,
      platform_type: 'MOBILE',
      tenant_name: 'dream_face',
      platformType: 'MOBILE',
      tenantName: 'dream_face'
    }, login.token, clientId);

    await sleep(500); // Sedikit delay agar aman

    const { param } = selectedModel;

    // 3. Submit Task
    await post(`${BASE}/task/v2/submit`, {
      ext_info: {
        sing_title: prompt.slice(0, 50),
        model: param.model
      },
      media: { texts: [{ text: prompt }], images: [], audios: [], videos: [] },
      output: param.output,
      template: {
        releation_id: param.releation_id,
        template_id: param.template_id,
        play_types: param.play_types
      },
      user: {
        user_id: userId,
        account_id: login.account_id,
        app_version: '4.7.1'
      },
      work_type: 'AI_IMAGE',
      create_work_session: true,
      platform_type: 'MOBILE',
      tenant_name: 'dream_face',
      platformType: 'MOBILE',
      tenantName: 'dream_face'
    }, login.token, clientId);

    // 4. Polling Result
    let attempts = 0;
    while (attempts < 30) { // Limit attempts agar tidak timeout di vercel (max 10s free tier, 60s pro)
      const ws = await post(`${BASE}/work_session/list`, {
        user_id: userId,
        account_id: login.account_id,
        page: 1,
        size: 5,
        session_type: 'AI_IMAGE',
        platform_type: 'MOBILE',
        tenant_name: 'dream_face',
        platformType: 'MOBILE',
        tenantName: 'dream_face'
      }, login.token, clientId);

      const s = ws.list?.[0];
      
      if (s?.session_status === 200 && s?.work_details?.[0]?.image_urls?.length) {
        return res.status(200).json({ 
          success: true, 
          images: s.work_details[0].image_urls,
          model: selectedModel.name
        });
      }
      
      if (s?.session_status < 0 && s?.session_status !== -1) { 
         throw new Error(`Task Rejected (Status: ${s.session_status})`);
      }

      await sleep(2000);
      attempts++;
    }

    return res.status(504).json({ error: 'Timeout waiting for image generation' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
      }
               
