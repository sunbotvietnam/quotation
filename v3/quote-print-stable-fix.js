// Stable print fix — isolate the active quote viewer from older print CSS without changing quote rendering.
(function(){
  const ORIGINAL_TITLE = document.title;

  function asciiSlug(value){
    return String(value||'')
      .replace(/[Đđ]/g, m => m === 'Đ' ? 'D' : 'd')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Za-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .replace(/-+/g,'-');
  }

  function defaultTitle(){
    const root=document.getElementById('quote-view-final');
    if(!root || !root.classList.contains('show')) return 'Bao-gia-Sunbot';
    const shownCode=String(root.querySelector('#qvf-sub')?.textContent||'').trim();
    const safeCode=shownCode ? shownCode.replace(/[\\/]+/g,'-').replace(/\s+/g,'-') : 'Bao-gia-Sunbot';
    const client=String(root.querySelector('.quote-recipient strong')?.textContent||'').trim();
    const safeClient=asciiSlug(client);
    return safeClient ? `${safeCode}_${safeClient}` : safeCode;
  }

  function restoreTitle(){
    document.title=ORIGINAL_TITLE;
    document.body.classList.remove('qvf-printing');
  }

  window.addEventListener('afterprint', restoreTitle);

  // Capture before the viewer's older click handler so only one print call occurs.
  document.addEventListener('click', function(ev){
    const btn=ev.target?.closest?.('#qvf-print');
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    const root=document.getElementById('quote-view-final');
    const doc=root?.querySelector('#quote-document');
    if(!root || !doc){
      alert('Chưa có nội dung báo giá để in. Vui lòng mở lại báo giá rồi thử lại.');
      return;
    }

    document.title=defaultTitle();
    document.body.classList.add('qvf-printing');

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      window.print();
      // Some Android browsers do not fire afterprint reliably.
      setTimeout(restoreTitle, 1800);
    }));
  }, true);

  const style=document.createElement('style');
  style.id='quote-print-stable-fix-style';
  style.textContent=`
    @media print {
      body.qvf-printing { overflow: visible !important; }

      /* Older approved-viewer CSS used an unconditional body child rule that hid
         the universal viewer. These selectors are deliberately more specific. */
      body.qvf-printing > #quote-view-final {
        display: block !important;
        visibility: visible !important;
        position: static !important;
        inset: auto !important;
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: visible !important;
      }
      body.qvf-printing > #employee-published-viewer,
      body.qvf-printing > #app {
        display: none !important;
      }
      body.qvf-printing #quote-view-final,
      body.qvf-printing #quote-view-final * {
        visibility: visible !important;
      }
      body.qvf-printing #quote-view-final .qvf-head,
      body.qvf-printing #quote-view-final .qvf-toolbar,
      body.qvf-printing #quote-view-final .no-print {
        display: none !important;
      }
      body.qvf-printing #quote-view-final .qvf-shell,
      body.qvf-printing #quote-view-final .qvf-body,
      body.qvf-printing #quote-view-final .quote-preview-wrap {
        display: block !important;
        position: static !important;
        width: auto !important;
        height: auto !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        overflow: visible !important;
      }
      body.qvf-printing #quote-view-final #quote-document {
        display: block !important;
        visibility: visible !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
