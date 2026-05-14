(function () {
  (function () {
    var roleBtns = document.querySelectorAll('.role-item');
    var roleInput = document.getElementById('report-role-input');
    var roleOther = document.getElementById('report-role-other');
    var roleReset = document.getElementById('report-role-reset');

    if (roleBtns && roleBtns.length && roleInput && roleReset) {
      roleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          roleBtns.forEach(function (b) {
            if (b !== btn) b.style.display = 'none';
            else b.classList.add('selected');
          });

          roleInput.value = btn.getAttribute('data-value') || btn.textContent.trim();
          roleReset.style.display = 'inline-block';

          if (roleInput.value === 'Otro') roleOther.style.display = 'block';
          else {
            roleOther.style.display = 'none';
            roleOther.value = '';
          }
        });
      });

      roleReset.addEventListener('click', function () {
        roleBtns.forEach(function (b) {
          b.style.display = 'inline-block';
          b.classList.remove('selected');
        });
        roleInput.value = '';
        roleOther.style.display = 'none';
        roleOther.value = '';
        roleReset.style.display = 'none';
      });
    }
  })();
})();
