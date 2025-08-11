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
            
            const formData = $form.serialize();
            const originalText = $submitBtn.html();
            
            $submitBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving...');
            
            $.ajax({
                url: $form.attr('action'),
                type: 'POST',
                data: formData,
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        $successAlert.text(response.message || 'Blog saved successfully!').removeClass('d-none');
                        
                        setTimeout(function() {
                            if (response.redirectUrl) {
                                window.location.href = response.redirectUrl;
                            } else {
                                window.location.href = '/on/demandware.store/Sites-RefArch-Site/default/Account-MyBlogs';
                            }
                        }, 1500);
                    } else {
                        $errorAlert.text(response.message || 'An error occurred').removeClass('d-none');
                        $submitBtn.prop('disabled', false).html(originalText);
                    }
                },
                error: function(xhr, status, error) {
                    $errorAlert.text('An error occurred. Please try again.').removeClass('d-none');
                    $submitBtn.prop('disabled', false).html(originalText);
                }
            });
        });
    },
    
    blogDelete: function() {
        $('body').on('click', '.btn-delete-blog', function(e) {
            e.preventDefault();
            
            const $btn = $(this);
            const blogId = $btn.data('blog-id');
            const blogTitle = $btn.data('blog-title');
            const deleteUrl = $btn.data('url');
            
            
            const csrfToken = $('.csrf-token').val();
            const csrfTokenName = $('.csrf-token').attr('name') || 'csrf_token';
            
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
                    } else {
                        alert(response.message || 'Failed to delete blog');
                    }
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 401 || xhr.status === 403) {
                        alert('Session expired. Page will reload.');
                        location.reload();
                    } else {
                        alert('Error deleting blog. Please try again.');
                    }
                }
            });
        });
    },
    
    blogSearch: function() {
        let searchTimeout;
        $('body').on('input', '#blog-search', function() {
            clearTimeout(searchTimeout);
            const $input = $(this);
            const query = $input.val().trim();
            const $suggestions = $('.blog-search-suggestions');
            
            if (query.length < 2) {
                $suggestions.empty().removeClass('show');
                return;
            }
            
            searchTimeout = setTimeout(function() {
                $.ajax({
                    url: $input.data('search-url'),
                    type: 'GET',
                    data: { q: query },
                    dataType: 'json',
                    success: function(response) {
                        if (response.suggestions && response.suggestions.length > 0) {
                            let html = '';
                            response.suggestions.forEach(function(item) {
                                html += '<a class="dropdown-item" href="' + item.url + '">' + item.value + '</a>';
                            });
                            $suggestions.html(html).addClass('show');
                        } else {
                            $suggestions.html('<span class="dropdown-item-text">No results found</span>').addClass('show');
                        }
                    },
                    error: function(xhr, status, error) {
                        $suggestions.empty().removeClass('show');
                    }
                });
            }, 300);
        });
        
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.blog-search-container, .form-group').length) {
                $('.blog-search-suggestions').removeClass('show');
            }
        });
    }
};
