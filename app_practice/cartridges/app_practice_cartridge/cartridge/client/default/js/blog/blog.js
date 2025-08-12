'use strict';

module.exports = {
    blogFormSubmit: function() {
        $('body').on('submit', '#blog-form', function(e) {
            e.preventDefault();
            const $form = $(this);
            const $submitBtn = $form.find('.btn-save-blog');
            const $errorAlert = $('.blog-form-messages .alert-danger');
            const $successAlert = $('.blog-form-messages .alert-success');
            $errorAlert.addClass('d-none').text('');
            $successAlert.addClass('d-none').text('');
            $('.form-control').removeClass('is-invalid');
            $('.invalid-feedback').remove();
            
            const formData = $form.serialize();
            
            $submitBtn.prop('disabled', true);
            
            $.ajax({
                url: $form.attr('action'),
                type: 'POST',
                data: formData,
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        if (response.message) {
                            $successAlert.text(response.message).removeClass('d-none');
                        }
                        
                        if (response.redirectUrl) {
                            setTimeout(function() {
                                window.location.href = response.redirectUrl;
                            }, 1500);
                        }
                    } else {
                        if (response.fields) {
                            Object.keys(response.fields).forEach(function(fieldName) {
                                const $field = $form.find('[name="' + fieldName + '"]');
                                if ($field.length) {
                                    $field.addClass('is-invalid');
                                    $field.after('<div class="invalid-feedback">' + response.fields[fieldName] + '</div>');
                                }
                            });
                        }
                        if (response.message) {
                            $errorAlert.text(response.message).removeClass('d-none');
                        }
                    }
                    
                    $submitBtn.prop('disabled', false);
                },
                error: function() {
                    $submitBtn.prop('disabled', false);
                }
            });
        });
    },

    blogDelete: function() {
        $('body').on('click', '.btn-delete-blog', function(e) {
            e.preventDefault();
            
            const $btn = $(this);
            const blogId = $btn.data('blog-id');
            const deleteUrl = $btn.data('url');
            const csrfToken = $('.csrf-token').val();
            const csrfTokenName = $('.csrf-token').attr('name');
            
            let requestData = {
                blogID: blogId
            };
            requestData[csrfTokenName] = csrfToken;
            
            $.ajax({
                url: deleteUrl,
                type: 'POST',
                data: requestData,
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        $btn.closest('tr').fadeOut(400, function() {
                            $(this).remove();
                            if ($('.table tbody tr').length === 0) {
                                location.reload();
                            }
                        });
                    } else if (response.message) {
                        alert(response.message);
                    }
                }
            });
        });
    }
};