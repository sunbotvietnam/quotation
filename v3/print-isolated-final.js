// Print quotation in an isolated document so app overlays / visibility rules can never blank the page.
(function(){
  function cssLinks(){
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l=>`<link rel="stylesheet" href="${l.href}">`).join('');
  }

  function buildPrintFrame(){
    const source=document.querySelector('#quote-view-final #quote-document') || document.querySelector('#quote-document');
    if(!source) throw new Error('Không tìm thấy nội dung báo giá để in.');

    let frame=document.getElementById('sunbot-print-frame');
    if(frame) frame.remove();
    frame=document.createElement('iframe');
    frame.id='sunbot-print-frame';
    frame.setAttribute('aria-hidden','true');
    frame.style.position='fixed';
    frame.style.right='0';
    frame.style.bottom='0';
    frame.style.width='1px';
    frame.style.height='1px';
    frame.style.border='0';
    frame.style.opacity='0';
    frame.style.pointerEvents='none';
    document.body.appendChild(frame);

    const doc=frame.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${cssLinks()}<style>
      html,body{margin:0!important;padding:0!important;background:#fff!important}
      body *{visibility:visible!important}
      #quote-document{display:block!important;visibility:visible!important;position:static!important;width:auto!important;margin:0!important;padding:0!important;overflow:visible!important}
      .no-print{display:none!important}
      @media print{body *{visibility:visible!important}#quote-document,#quote-document *{visibility:visible!important}}
    </style></head><body>${source.outerHTML}</body></html>`);
    doc.close();
    return frame;
  }

  function showWait(msg){
    try{window.SUNBOT_INTERACTION_FEEDBACK?.show?.(msg||'Đang chuẩn bị bản in');}catch(_){ }
  }
  function hideWait(){
    try{window.SUNBOT_INTERACTION_FEEDBACK?.hide?.();}catch(_){ }
  }

  function printQuote(){
    showWait('Đang chuẩn bị bản in');
    let frame;
    try{frame=buildPrintFrame();}
    catch(e){hideWait();alert(e.message||'Không chuẩn bị được bản in.');return;}

    const doPrint=()=>{
      try{
        const w=frame.contentWindow;
        w.focus();
        w.print();
      }catch(e){alert('Không mở được cửa sổ in. Vui lòng thử lại.');}
      finally{
        hideWait();
        setTimeout(()=>{try{frame.remove();}catch(_){}},1500);
      }
    };

    // Give linked styles and logo enough time to settle, without blocking the user interface.
    const img=frame.contentDocument.querySelector('img');
    if(img && !img.complete){
      let done=false;
      const go=()=>{if(done)return;done=true;setTimeout(doPrint,120);};
      img.addEventListener('load',go,{once:true});
      img.addEventListener('error',go,{once:true});
      setTimeout(go,900);
    }else setTimeout(doPrint,180);
  }

  // Capture before older handlers that call window.print() on the app page.
  window.addEventListener('click',function(ev){
    const btn=ev.target?.closest?.('#qvf-print,#epv-print');
    if(!btn)return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    printQuote();
  },true);

  window.SUNBOT_PRINT_QUOTE={print:printQuote,version:'2026.09.08-isolated-v1'};
})();
