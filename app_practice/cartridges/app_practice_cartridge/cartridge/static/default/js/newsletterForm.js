'use strict';

(function () {
    function displayMessage(data, $form) {
        const $button = $form.find('button[type="submit"]');
        const status = data.success ? 'alert-success' : 'alert-danger';
        let emailSignupMsg = document.querySelector('.email-signup-message');

        // Handle field validation errors
        if (!data.success && data.fields) {
            $form.find('.is-invalid').removeClass('is-invalid');
            $form.find('.invalid-feedback').text('');

            Object.keys(data.fields).forEach(function (fieldName) {
                var field = $form.find('[name="' + fieldName + '"]');
                var errorEl = field.siblings('.invalid-feedback');
                field.addClass('is-invalid');
                errorEl.text(data.fields[fieldName]);
            });

            $button.removeAttr('disabled');
            return;
        }

        // Handle general messages
        if (!emailSignupMsg) {
            emailSignupMsg = document.createElement('div');
            emailSignupMsg.className = 'email-signup-message';
            document.body.appendChild(emailSignupMsg);
        }

        emailSignupMsg.innerHTML = `
            <div class="email-signup-alert text-center ${status}">
                ${data.msg || (data.success ? 'Saved successfully!' : 'Something went wrong')}
            </div>`;

        setTimeout(() => {
            emailSignupMsg.remove();
            $button.removeAttr('disabled');
        }, 3000);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const form = document.querySelector('.newsletter-form');

        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            fetch(form.action, {
                method: form.method,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success && data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        displayMessage(data, $(form));
                    }
                })
                .catch((err) => {
                    console.error(err);
                    displayMessage({ success: false, msg: 'Request failed' }, $(form));
                });
        });
    });
})();