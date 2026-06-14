// Shared customer auth widget (login / sign up / forgot password / header state)
// Requires window.__supabaseClient to be set before this script runs.
(function(){
  var client = window.__supabaseClient;

  var STYLE = '' +
    '.eth-auth-overlay{position:fixed;inset:0;background:rgba(31,37,30,.45);opacity:0;pointer-events:none;transition:opacity .25s;z-index:400;}' +
    '.eth-auth-overlay.open{opacity:1;pointer-events:auto;}' +
    '.eth-auth-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.96);width:380px;max-width:92vw;background:#fcfbf8;border-radius:1.5rem;box-shadow:0 24px 64px rgba(0,0,0,.25);padding:2rem;z-index:401;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;font-family:"Inter",ui-sans-serif,system-ui,sans-serif;}' +
    '.eth-auth-modal.open{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1);}' +
    '.eth-auth-modal h3{font-family:"Cormorant Garamond",serif;font-weight:400;font-size:1.6rem;margin-bottom:1.25rem;color:#1f251e;}' +
    '.eth-auth-tabs{display:flex;gap:1.5rem;margin-bottom:1.25rem;border-bottom:1px solid #d9d4c9;}' +
    '.eth-auth-tab{background:none;border:none;padding:0 0 .6rem;font-size:.8rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#5e6354;cursor:pointer;border-bottom:2px solid transparent;font-family:Inter,sans-serif;}' +
    '.eth-auth-tab.active{color:#8b744b;border-bottom-color:#8b744b;}' +
    '.eth-auth-field{margin-bottom:.9rem;}' +
    '.eth-auth-field label{display:block;font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#5e6354;margin-bottom:.35rem;}' +
    '.eth-auth-field input{width:100%;padding:.65rem .85rem;border:1px solid #d9d4c9;border-radius:.6rem;font-size:.9rem;font-family:Inter,sans-serif;background:#fff;}' +
    '.eth-auth-field input:focus{outline:none;border-color:#8b744b;}' +
    '.eth-auth-submit{width:100%;border-radius:9999px;border:1px solid #8b744b;background:#8b744b;color:#f9f6f1;font-size:.85rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:.75rem 1rem;cursor:pointer;font-family:Inter,sans-serif;margin-top:.4rem;}' +
    '.eth-auth-submit:hover{background:#796340;}' +
    '.eth-auth-submit:disabled{opacity:.6;cursor:not-allowed;}' +
    '.eth-auth-status{font-size:.8rem;margin-top:.85rem;color:#5e6354;}' +
    '.eth-auth-status.error{color:#a33;}' +
    '.eth-auth-close{position:absolute;top:1rem;right:1.25rem;background:none;border:none;font-size:1.4rem;line-height:1;cursor:pointer;color:#1f251e;}' +
    '.eth-auth-link{font-size:.8rem;color:#8b744b;cursor:pointer;text-decoration:underline;background:none;border:none;font-family:Inter,sans-serif;padding:0;}' +
    '.eth-auth-area{display:flex;align-items:center;gap:.9rem;}' +
    '.eth-auth-btn{background:rgba(249,246,241,.15);border:1.5px solid rgba(249,246,241,.7);color:#f9f6f1;font-size:.78rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;border-radius:9999px;padding:.45rem 1.2rem;cursor:pointer;font-family:Inter,sans-serif;transition:background .2s,border-color .2s;}' +
    '.eth-auth-btn:hover{background:rgba(249,246,241,.28);border-color:#f9f6f1;}' +
    '.eth-auth-account{display:flex;align-items:center;gap:.75rem;}' +
    '.eth-auth-account a{text-decoration:none;color:inherit;font-size:.78rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;}' +
    '.eth-auth-account button{background:none;border:none;color:inherit;font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;text-decoration:underline;cursor:pointer;font-family:Inter,sans-serif;padding:0;opacity:.8;}';

  var styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  var overlay = document.createElement('div');
  overlay.className = 'eth-auth-overlay';
  overlay.id = 'eth-auth-overlay';

  var modal = document.createElement('div');
  modal.className = 'eth-auth-modal';
  modal.id = 'eth-auth-modal';
  modal.innerHTML = '' +
    '<button class="eth-auth-close" id="eth-auth-close" aria-label="Close">×</button>' +
    '<div class="eth-auth-tabs">' +
      '<button class="eth-auth-tab" data-mode="login">Sign In</button>' +
      '<button class="eth-auth-tab" data-mode="signup">Sign Up</button>' +
    '</div>' +
    '<div id="eth-auth-body"></div>';

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  var bodyEl = modal.querySelector('#eth-auth-body');
  var tabs = modal.querySelectorAll('.eth-auth-tab');
  var closeBtn = modal.querySelector('#eth-auth-close');
  var currentMode = 'login';

  function close(){
    overlay.classList.remove('open');
    modal.classList.remove('open');
  }

  function open(mode){
    currentMode = mode || 'login';
    render();
    overlay.classList.add('open');
    modal.classList.add('open');
  }

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      currentMode = tab.getAttribute('data-mode');
      render();
    });
  });

  function setStatus(msg, isError){
    var el = bodyEl.querySelector('.eth-auth-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'eth-auth-status' + (isError ? ' error' : '');
  }

  function render(){
    tabs.forEach(function(tab){
      tab.classList.toggle('active', tab.getAttribute('data-mode') === currentMode || (currentMode === 'forgot' && tab.getAttribute('data-mode') === 'login'));
    });

    if (currentMode === 'login'){
      bodyEl.innerHTML = '' +
        '<h3>Welcome Back</h3>' +
        '<form id="eth-login-form">' +
          '<div class="eth-auth-field"><label>Email</label><input type="email" id="eth-login-email" required></div>' +
          '<div class="eth-auth-field"><label>Password</label><input type="password" id="eth-login-password" required></div>' +
          '<button type="submit" class="eth-auth-submit">Sign In</button>' +
          '<p class="eth-auth-status"></p>' +
          '<p style="margin-top:.75rem;"><button type="button" class="eth-auth-link" id="eth-forgot-link">Forgot your password?</button></p>' +
        '</form>';
      bodyEl.querySelector('#eth-login-form').addEventListener('submit', async function(e){
        e.preventDefault();
        var email = bodyEl.querySelector('#eth-login-email').value.trim();
        var password = bodyEl.querySelector('#eth-login-password').value;
        var btn = e.target.querySelector('.eth-auth-submit');
        btn.disabled = true;
        setStatus('Logging in…');
        var res = await client.auth.signInWithPassword({ email: email, password: password });
        btn.disabled = false;
        if (res.error){
          setStatus(res.error.message, true);
          return;
        }
        close();
      });
      bodyEl.querySelector('#eth-forgot-link').addEventListener('click', function(){
        currentMode = 'forgot';
        render();
      });
    } else if (currentMode === 'signup'){
      bodyEl.innerHTML = '' +
        '<h3>Create an Account</h3>' +
        '<form id="eth-signup-form">' +
          '<div class="eth-auth-field"><label>Full Name</label><input type="text" id="eth-signup-name" required></div>' +
          '<div class="eth-auth-field"><label>Email</label><input type="email" id="eth-signup-email" required></div>' +
          '<div class="eth-auth-field"><label>Password</label><input type="password" id="eth-signup-password" minlength="6" required></div>' +
          '<button type="submit" class="eth-auth-submit">Sign Up</button>' +
          '<p class="eth-auth-status"></p>' +
        '</form>';
      bodyEl.querySelector('#eth-signup-form').addEventListener('submit', async function(e){
        e.preventDefault();
        var name = bodyEl.querySelector('#eth-signup-name').value.trim();
        var email = bodyEl.querySelector('#eth-signup-email').value.trim();
        var password = bodyEl.querySelector('#eth-signup-password').value;
        var btn = e.target.querySelector('.eth-auth-submit');
        btn.disabled = true;
        setStatus('Creating your account…');
        var res = await client.auth.signUp({
          email: email,
          password: password,
          options: { data: { full_name: name } }
        });
        btn.disabled = false;
        if (res.error){
          setStatus(res.error.message, true);
          return;
        }
        if (res.data && res.data.session){
          close();
        } else {
          setStatus('Check your email to confirm your account, then log in.');
        }
      });
    } else if (currentMode === 'forgot'){
      bodyEl.innerHTML = '' +
        '<h3>Reset Password</h3>' +
        '<form id="eth-forgot-form">' +
          '<div class="eth-auth-field"><label>Email</label><input type="email" id="eth-forgot-email" required></div>' +
          '<button type="submit" class="eth-auth-submit">Send Reset Link</button>' +
          '<p class="eth-auth-status"></p>' +
        '</form>';
      bodyEl.querySelector('#eth-forgot-form').addEventListener('submit', async function(e){
        e.preventDefault();
        var email = bodyEl.querySelector('#eth-forgot-email').value.trim();
        var btn = e.target.querySelector('.eth-auth-submit');
        btn.disabled = true;
        setStatus('Sending…');
        var res = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/account.html'
        });
        btn.disabled = false;
        if (res.error){
          setStatus(res.error.message, true);
          return;
        }
        setStatus('Check your email for a password reset link.');
      });
    }
  }

  // ---- Header auth area ----
  function esc(str){
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function renderHeader(session){
    var area = document.getElementById('auth-area');
    if (!area) return;
    if (session && session.user){
      area.innerHTML = '<a class="eth-auth-btn" href="/account.html">Dashboard</a>';
    } else {
      area.innerHTML = '<button class="eth-auth-btn" id="eth-login-btn">Sign In</button>';
      area.querySelector('#eth-login-btn').addEventListener('click', function(){
        open('login');
      });
    }
  }

  // Render Sign In button immediately so it's visible before async session check
  renderHeader(null);

  if (client){
    client.auth.getSession().then(function(res){
      renderHeader(res.data && res.data.session);
    });
    client.auth.onAuthStateChange(function(_event, session){
      renderHeader(session);
    });
  }

  window.EtherealAuth = {
    open: open,
    close: close,
    client: client
  };
})();
