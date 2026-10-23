import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { configurationReport } from '../api/_settings.js';
import session from '../api/session.js';
import content from '../api/content.js';
import { createSessionCookie, isAdmin } from '../api/_auth.js';

process.env.SESSION_SECRET = 'settings-unit-test-secret-not-a-real-credential';
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code;return this; }, json(data) { this.data=data;return this; } }; }
function req(method='GET', authenticated=true, extra={}) {
  return { method, query: {}, headers: { ...(authenticated ? { cookie: createSessionCookie().split(';')[0] } : {}), ...extra } };
}

test('kurulum raporu gereklileri ve opsiyonelleri ayırır; sırları dışarı vermez', () => {
  const missing = configurationReport({});
  assert.equal(missing.ready,false);
  assert.equal(missing.checks.filter(x=>x.required&&x.status==='missing').length,3);
  const env={DATABASE_URL:'postgresql://user:secret-db@db.example/test',ADMIN_PASSWORD:'secret-password-very-long',SESSION_SECRET:'secret-session-'.repeat(4),OPENAI_API_KEY:'private-ai-value',PINTEREST_ACCESS_TOKEN:'private-pin-value',PINTEREST_BOARD_ID:'private-board-value',GOOGLE_CLIENT_ID:'private-google-client-id',GOOGLE_CLIENT_SECRET:'private-google-client-secret',SITE_URL:'https://site.example'};
  const result=configurationReport(env);
  assert.equal(result.ready,true);
  assert.equal(result.connectivityTested,false);
  assert.ok(result.checks.every(x=>x.status==='configured'));
  for(const value of Object.values(env))assert.ok(!JSON.stringify(result).includes(value));
  assert.equal(configurationReport({...env,DATABASE_URL:'https://not-postgres.example'}).ready,false);
  assert.equal(configurationReport({...env,ADMIN_PASSWORD:'short'}).ready,false);
  assert.equal(configurationReport({...env,SESSION_SECRET:'short'}).ready,false);
  assert.equal(configurationReport({...env,SITE_URL:'https://site.example/path'}).checks.find(x=>x.id==='site').status,'optional');
});

test('ayarlar yalnızca yöneticiye açılır, oturum yanıtları önbelleğe alınmaz', () => {
  for(const authenticated of [false,true]) {
    const request=req('GET',authenticated);request.query.settings='1';const res=response();session(request,res);
    assert.equal(res.code,authenticated?200:401);
    assert.equal(res.headers['Cache-Control'],'no-store');
    if(!authenticated)assert.equal(res.data.checks,undefined);
  }
  const res=response();session(req('GET',false),res);assert.deepEqual(res.data,{authenticated:false});
});

test('güvenli çıkış çerezi sona erdirir; cross-site çıkış reddedilir', () => {
  const res=response();session(req('DELETE'),res);assert.equal(res.code,200);assert.match(res.headers['Set-Cookie'],/Max-Age=0/);assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);
  const denied=response();session(req('DELETE',true,{'sec-fetch-site':'cross-site'}),denied);assert.equal(denied.code,403);
  const invalid=response();session(req('POST'),invalid);assert.equal(invalid.code,405);assert.equal(invalid.headers.Allow,'GET, DELETE');
});

test('oturum doğrulaması hatalı süre ve fazla token parçalarını reddeder', () => {
  assert.equal(isAdmin(req()),true);
  assert.equal(isAdmin({}),false);
  for(const expiry of ['NaN','Infinity','abc','0']) {
    const sig=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(expiry).digest('hex');
    assert.equal(isAdmin({headers:{cookie:`testotavan_admin=${expiry}.${sig}`}}),false);
  }
  const request=req();request.headers.cookie+='.extra';assert.equal(isAdmin(request),false);
});

test('içerik mutasyonları DB bağlantısından önce yetki, JSON ve CSRF denetler',async()=>{
  const old=process.env.DATABASE_URL;delete process.env.DATABASE_URL;
  try {
    for(const method of ['POST','PUT','DELETE']) {
      const res=response();await content(req(method,false),res);assert.equal(res.code,401);assert.equal(res.headers['Cache-Control'],'no-store');
    }
    const cross=response();await content(req('PUT',true,{'sec-fetch-site':'cross-site'}),cross);assert.equal(cross.code,403);
    const type=response();await content(req('POST',true,{'content-type':'text/plain'}),type);assert.equal(type.code,415);
    const body=response();await content({...req('POST',true,{'content-type':'application/json'}),body:[]},body);assert.equal(body.code,400);
    const method=response();await content(req('PATCH'),method);assert.equal(method.code,405);
  } finally {if(old===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=old;}
});
