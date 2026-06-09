(function(){
  const form = document.getElementById('contact-form');
  const wrap = document.getElementById('contact-form-wrap');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const formData = new FormData(form);
    const payload = new URLSearchParams(formData).toString();

    fetch(window.formWebhookUrl || form.action || location.href, {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: payload
    }).catch(()=>{});

    wrap.innerHTML = '<div class="success"><div class="big">✅</div><h3>Got it! Wendy is on it.</h3><p>Thanks for reaching out — you\'ll hear back within 24 hours with ideas for your first AI-powered campaign.</p></div>';
  });
})();