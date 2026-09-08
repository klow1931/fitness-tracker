    // Rest timer
    let restInterval = null;
    function setRestLabels(text) {
      const el = document.getElementById('rest-timer');
      const sticky = document.getElementById('rest-timer-sticky');
      if (el) el.textContent = text;
      if (sticky) sticky.textContent = text;
    }
    function startRest(seconds) {
      stopRest();
      const deadline = Date.now() + seconds * 1000;
      let left = seconds;
      setRestLabels(left + 's');
      restInterval = setInterval(() => {
        left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setRestLabels(left + 's');
        if (left <= 0) {
          stopRest();
          setRestLabels('Done!');
          showToast('Rest done', 'success');
          try { navigator.vibrate && navigator.vibrate(200); } catch (e) {}
        }
      }, 1000);
    }
    function stopRest() {
      if (restInterval) clearInterval(restInterval);
      restInterval = null;
      const el = document.getElementById('rest-timer');
      if (el && el.textContent !== 'Done!') setRestLabels('—');
      else if (!el) setRestLabels('—');
    }

