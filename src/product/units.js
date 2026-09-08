    // ========== Unit helpers (internal storage is always kg) ==========
    const KG_TO_LB = 2.2046226218;

    function currentUnit() {
      return data.unit || 'kg';
    }

    function unitLabel() {
      return currentUnit() === 'lb' ? 'lb' : 'kg';
    }

    /** Convert kg → display unit */
    function toDisplay(kg) {
      if (kg == null || isNaN(kg)) return kg;
      if (currentUnit() === 'lb') return Math.round(kg * KG_TO_LB * 10) / 10;
      return Math.round(kg * 10) / 10;
    }

    /** Convert display unit → kg for storage */
    function toStorage(val) {
      if (val == null || isNaN(val)) return val;
      if (currentUnit() === 'lb') return Math.round((val / KG_TO_LB) * 100) / 100;
      return val;
    }

    function setUnit(u) {
      if (u !== 'kg' && u !== 'lb') return;
      const oldUnit = currentUnit();
      document.querySelectorAll('#exercise-rows .set-weight').forEach(input => { if (input.value !== '') input.value = Math.round(Number(input.value) * (oldUnit === u ? 1 : u === 'lb' ? KG_TO_LB : 1 / KG_TO_LB) * 100) / 100; });
      data.unit = u;
      document.querySelectorAll('#exercise-rows .set-weight').forEach(input => { input.placeholder = u; input.setAttribute('aria-label', u); });
      saveLoggerDraft();
      saveData(data);
      updateUnitToggle();
      document.querySelectorAll('.unit-label').forEach(el => el.textContent = unitLabel());
      const plateBar = document.getElementById('plate-bar');
      if (plateBar) plateBar.value = u === 'lb' ? 45 : 20;
      const active = document.querySelector('.tab-btn.nav-active');
      if (active) showTab(active.id.replace('tab-', ''));
    }

    function updateUnitToggle() {
      const isKg = currentUnit() === 'kg';
      const kgBtn = document.getElementById('unit-kg');
      const lbBtn = document.getElementById('unit-lb');
      if (kgBtn && lbBtn) {
        kgBtn.className = isKg ? 'px-3 py-1.5 bg-indigo-600 text-white' : 'px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50';
        lbBtn.className = !isKg ? 'px-3 py-1.5 bg-indigo-600 text-white' : 'px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50';
      }
    }

