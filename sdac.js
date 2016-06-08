
function runSDAC() {
    var domText = window.ace.edit($('#domainSelection').find(':selected').val()).getSession().getValue();
    var probText = window.ace.edit($('#problemSelection').find(':selected').val()).getSession().getValue();

    window.sdacURL = $('#plannerURL').val();
    if (window.sdacURL.slice(-1) === "/")
        window.sdacURL = window.sdacURL.slice(0, window.sdacURL.length-1);

    window.toastr.info('Running SDAC translation...');

    $('#chooseFilesModal').modal('toggle');

    $.ajax( {url: window.sdacURL + "/solve",
             type: "POST",
             contentType: 'application/json',
             data: JSON.stringify({"domain": domText, "problem": probText})})
        .done(function (res) {

                if (res['status'] === 'ok') {
                    window.toastr.success('Translation complete!');
                } else {
                    window.toastr.error('Translation failed.');
                }

                showSDAC(res);

            }).fail(function (res) {
                window.toastr.error('Error: Malformed URL?');
            });
}

function showSDAC(res) {

    if (!(res['status'] === 'ok')) {
        var tab_name = 'Error (' + (Object.keys(window.plans).length + 1) + ')';

        window.new_tab(tab_name, function(editor_name) {
            var html = '';
            window.plans[editor_name] = res.result;

            html += '<div class=\"plan-display\">\n';
            html += '<pre class=\"plan-display-action well\">\n';
            if (res['result']['parse_status'] === 'err')
                html += res['result']['error'];
            else
                html += JSON.stringify(res['result'], null, 2);
            html += '</pre>';

            $('#' + editor_name).html(html);
        });
    } else {
        var editor1 = "editor" + window.max_editor_num;
        var editor2 = "editor" + (window.max_editor_num + 1);

        var e1fname = "SDAC-domain-"+window.max_editor_num+".pddl";
        var e2fname = "SDAC-problem-"+(window.max_editor_num+1)+".pddl";

        createEditor();

        $('#tab-' + window.current_editor).text(e1fname);
        var editor = window.ace.edit(window.current_editor);
        editor.getSession().setValue(res.result.domain_out);

        createEditor()
        $('#tab-' + window.current_editor).text(e2fname);
        editor = window.ace.edit(window.current_editor);
        editor.getSession().setValue(res.result.problem_out);
    }

}

define(function () {

    // Use this as the default solver url
    window.sdacURL = "http://cloud-sdac-translator.herokuapp.com/";

    return {

        name: "SDAC Translator",
        author: "Florian Geißer (sdac) Christian Muise (plugin)",
        email: "geisserf@informatik.uni-freiburg.de,christian.muise@gmail.com",
        description: "Translates a problem with state-dependent action costs into one without.",

        initialize: function() {
            // This will be called whenever the plugin is loaded or enabled

            window.add_menu_button('SDAC', 'sdacMenuItem', 'glyphicon-sd-video', "chooseFiles('sdac')");

            window.register_file_chooser('sdac',
            {
                showChoice: function() {
                    window.setup_file_chooser('Convert', 'Convert to State-Independent Costs');
                    $('#plannerURL').val(window.sdacURL);
                },
                selectChoice: runSDAC
            });

        },

        disable: function() {
            // This is called whenever the plugin is disabled
            window.remove_menu_button('sdacMenuItem');
        },

        save: function() {
            // Used to save the plugin settings for later
            return {url: window.sdacURL};
        },

        load: function(settings) {
            // Restore the plugin settings from a previous save call
            window.sdacURL = settings.url;
        }

    };
});
