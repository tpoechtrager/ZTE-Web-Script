/*
 * 
 * Original code by Miononno
 * https://www.youtube.com/watch?v=1kanq1w2DA0
 * 
 * Enhanced by unknown @ lteforum.at
 * 
 */

console.log("Loading ZTE Script v" + "2025-04-17-#1");

siginfo =
    "wan_active_band,wan_active_channel,wan_lte_ca,wan_apn,wan_ipaddr," +
    "cell_id,dns_mode,prefer_dns_manual,standby_dns_manual,network_type," +

    "network_provider_fullname," +
    "rmcc,rmnc," +

    "ip_passthrough_enabled," +

    "bandwidth," +
    "tx_power," +

    "rscp_1,ecio_1,rscp_2,ecio_2,rscp_3,ecio_3,rscp_4,ecio_4," +

    "ngbr_cell_info," +
    "lte_multi_ca_scell_info,lte_multi_ca_scell_sig_info," +
    "lte_band,lte_rsrp,lte_rsrq," +
    "lte_rsrq,lte_rssi,lte_rsrp,lte_snr," +
    "lte_ca_pcell_band,lte_ca_pcell_freq,lte_ca_pcell_bandwidth," +
    "lte_ca_scell_band,lte_ca_scell_bandwidth," +
    "lte_rsrp_1,lte_rsrp_2,lte_rsrp_3,lte_rsrp_4," +
    "lte_snr_1,lte_snr_2,lte_snr_3,lte_snr_4," +
    "lte_pci,lte_pci_lock,lte_earfcn_lock," +

    "5g_rx0_rsrp,5g_rx1_rsrp,Z5g_rsrp,Z5g_rsrq,Z5g_SINR," +
    "nr5g_cell_id,nr5g_pci," +
    "nr5g_action_channel,nr5g_action_band," +
    "nr5g_action_nsa_band," +
    "nr_ca_pcell_band,nr_ca_pcell_freq," +
    "nr_multi_ca_scell_info," +
    "nr5g_sa_band_lock,nr5g_nsa_band_lock," +

    "pm_sensor_ambient,pm_sensor_mdm,pm_sensor_5g,pm_sensor_pa1,wifi_chip_temp";

is_mc888 = false;
is_mc889 = false;
logged_in_as_developer = false;

function dump_variable(v)
{
    for (property in v)
    {
        try
        {
            console.log(property + ":" + JSON.stringify(v[property]));
        }
        catch { }
    }
}

function var2html(prefix, v)
{
    for (index in v)
    {
        var items = v[index];
    
        for (item_index in items)
            $("#" + prefix + "_" + index + "_" + item_index).html(items[item_index]);
    }
}

function test_cmd(cmd)
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: cmd,
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            console.log(a);
        }
    });
}

// https://stackoverflow.com/a/68009748/1392778
window.cookies = window.cookies || 
{
    // https://stackoverflow.com/a/25490531/1028230
    get: function(name)
    {
        var b = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return b ? b.pop() : null;
    },

    delete: function(name)
    {
        document.cookie = '{0}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
            .replace('{0}', name);
    },

    set: function(name, value)
    {
        document.cookie =
            '{0}={1};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax'
            .replace('{0}', name)
            .replace('{1}', value);
    }
};

function show_logout_and_shutdown_buttons()
{
    document.getElementById("logout").childNodes.forEach(el => {
        $(el).hide();
        $(el).show();
    });
}

wait_for_log_in_done = false;
function wait_for_log_in()
{
    check_log_in(
        function()
        {
            if (wait_for_log_in_done) return;
            wait_for_log_in_done = true;

            inject_html();
            get_status();

            show_logout_and_shutdown_buttons_i = 0;
            show_logout_and_shutdown_buttons_timer_id = window.setInterval(function() {
                show_logout_and_shutdown_buttons();
                if (++show_logout_and_shutdown_buttons_i >= 6)
                    window.clearInterval(show_logout_and_shutdown_buttons_timer_id);
            }, 500);

            show_logout_and_shutdown_buttons();
        
            window.setInterval(get_status, 1000);
            window.setInterval(prevent_automatic_logout, 60000);

            window.clearInterval(wait_for_log_in_timer_id);
        },

        function()
        {
            if (typeof show_log_in_info_once === "undefined")
                console.log("Contents of script will show once you are logged in!");
            show_log_in_info_once = true;
        }
    );
}

function init()
{
    wait_for_log_in_timer_id = window.setInterval(wait_for_log_in, 250);
    wait_for_log_in();
}

function perform_automatic_login_or_init()
{
    if (have_admin_password_hash())
    {
        check_log_in(
        
            function()
            {
                console.log("Already logged in ...");
                init();
            },

            function()
            {
                console.log("Logging in ...");
                perform_login(function() {
                    console.log("... logged in");
                    init();
                    hash_fix_i = 0;
                    hash_fix_timer_id = window.setInterval(function() {
                        window.location.hash = "home";
                        if (++hash_fix_i >= 10) window.clearInterval(hash_fix_timer_id);
                    }, 100);
                });
            }
        
        );
    }
    else init();
}

/*
 * Wait until inner version string is available.
 */
prepare_2_done = false;
function prepare_2()
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "wa_inner_version"
        },
        dataType: "json",
        success: function(a)
        {
            if (a.wa_inner_version == "" || prepare_2_done) return;
            prepare_2_done = true;

            is_mc888 = a.wa_inner_version.indexOf("MC888") > -1;
            is_mc889 = a.wa_inner_version.indexOf("MC889") > -1;

            if (is_mc888 || is_mc889) hash = SHA256;
            else hash = hex_md5;

            perform_automatic_login_or_init();

            window.clearInterval(prepare_2_timer_id);
        }
    })
}

/*
 * Wait until SHA256() is available.
 */
function prepare_1()
{
    if (typeof SHA256 === "undefined")
    {
        return;
    }

    window.clearInterval(prepare_1_timer_id);

    prepare_2_timer_id = window.setInterval(prepare_2, 250);
    prepare_2();
}

function make_hidden_settings_visible()
{
    alert("This option makes hidden device settings visible.\n" +
          "Hidden settings are marked with a '[hidden option]' suffix");

    window.setInterval(function() {
        Array.from(document.querySelectorAll('*')).forEach(el => {
            // $(el).hide();
            // $(el).show();
            if($("#ipv4_section").length > 0) {
                $('#ipv4_section .row').css('display', 'block');
            }
            if (el.classList.contains("hide")) {
                el.classList.remove("hide");
                el.innerHTML += "&nbsp;[hidden option]";
            }
        })},
    1000);
}

function have_admin_password_hash()
{
    return cookies.get("admin_password_hash") !== null;
}

function perform_login(successCallback, developer_login = false, save_password_hash = false)
{
    var password_hash = "";

    if (have_admin_password_hash())
        password_hash = cookies.get("admin_password_hash");

    if (password_hash == "")
    {
        var password = prompt("Router Password");

        if (password == null || password == "")
            return;

        password_hash = SHA256(password);
    }

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "wa_inner_version,cr_version,RD,LD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD);
            $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data:
                {
                    isTest: "false",
                    goformId: developer_login ? "DEVELOPER_OPTION_LOGIN" : "LOGIN",
                    password: SHA256(password_hash + a.LD),
                    AD: ad
                },
                success: function(a)
                {
                    var j = JSON.parse(a);
                    console.log(j);
                    if ("0" == j.result)
                    {
                        if (save_password_hash) cookies.set("admin_password_hash", password_hash);
                        if (successCallback) successCallback();
                    }
                    else
                    {
                        var reason = "";
                        switch (j.result)
                        {
                            case "1":
                            {
                                reason = "Try again later";
                                break;
                            }
                            case "3":
                            {
                                reason = "Wrong Password";
                                if (have_admin_password_hash())
                                {
                                    console.log("Wrong password. Removing stored password hash ...");
                                    cookies.delete("admin_password_hash");
                                }
                                break;
                            }
                            default: reason = "Unknown";
                        }
                        alert((developer_login ? "Developer login" : "Login") + " failed! Reason: " + reason + ".");
                    }
                },
                error: err
            });
        }
    });
}

function prevent_automatic_logout()
{
    $.ajax({
        type: "GET",
        url: "/tmpl/network/apn_setting.html?v=" + Math.round(+new Date() / 1000)
    });
}

function enable_automatic_login()
{
    var res = confirm("You can make this script log in for you\n" +
                      "once you paste it into the developer console.\n\n" +
                      "The password will be stored in a cookie as an SHA256 hash.\n\n" +
                      "Continue?");

    if (!res)
        return;

    cookies.delete("admin_password_hash");

    perform_login(function() {
        alert("Successfully saved password as hash!");
    }, false, true);
}

function check_log_in(logged_in_callback, not_logged_in_callback = null)
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            // multi_data is required here otherwise
            // a false "ok" might be returned by the
            // router if a session in another browser
            // is running.
            multi_data: "1",
            cmd: "loginfo"
        },
        dataType: "json",
        success: function(a)
        {
            if (a.loginfo.toLowerCase() == "ok")
            {
                if (logged_in_callback)
                    logged_in_callback();
            }
            else
            {
                if (not_logged_in_callback)
                    not_logged_in_callback();
            }
        },
        error: err
    });
}

class LteCaCellInfo
{
    constructor(pci, band, earfcn, bandwidth, rssi, rsrp1, rsrp2, rsrp3, rsrp4, rsrq, sinr1, sinr2, sinr3, sinr4)
    {
        this.pci = pci;
        this.band = band;
        this.earfcn = earfcn;
        this.bandwidth = bandwidth;
        this.rssi = rssi;
        this.rsrp1 = rsrp1;
        this.rsrp2 = rsrp2;
        this.rsrp3 = rsrp3;
        this.rsrp4 = rsrp4;
        this.rsrq = rsrq;
        this.sinr1 = sinr1;
        this.sinr2 = sinr2;
        this.sinr3 = sinr3;
        this.sinr4 = sinr4;
    }
}

function parse_lte_cell_info()
{
    //Object { lte_multi_ca_scell_sig_info: "-44.0,-3.0,19.5,0,2;", lte_multi_ca_scell_info: "1,XX,2,3,1525,15.0" }

    // lte_multi_ca_scell_info
    // 0: CaIndex
    // 1: PCI
    // 2: ??
    // 3: Band
    // 4: Earfcn
    // 5: Bandwidth

    // lte_multi_ca_scell_sig_info
    // 0: RSRP, -44 invalid
    // 1: RSRQ
    // 2: SINR
    // 3: ??
    // 4: ??

    if (!is_lte)
        return [];

    var lte_cells = [];

    var lte_main_band = 
        (lte_ca_pcell_band != "" ? lte_ca_pcell_band : lte_band);

    if (lte_main_band == "")
        lte_main_band = "??";

    lte_cells.push(new LteCaCellInfo(
        parseInt(lte_pci, 16),
        "B" + lte_main_band,
        lte_ca_pcell_freq == "" ? wan_active_channel : lte_ca_pcell_freq,
        (lte_ca_pcell_bandwidth != "" ? lte_ca_pcell_bandwidth : bandwidth).replace("MHz", "").replace(".0", ""),
        lte_rssi,
        lte_rsrp_1,
        lte_rsrp_2,
        lte_rsrp_3,
        lte_rsrp_4,
        lte_rsrq,
        lte_snr_1,
        lte_snr_2,
        lte_snr_3,
        lte_snr_4
    ));

    // Only MC888 seems to have lte_multi_ca_scell_sig_info so far.
    // MC889 doesn't have it.

    var scell_infos = lte_multi_ca_scell_info.split(";").filter(n => n);
    var scell_sig_infos = lte_multi_ca_scell_sig_info.split(";").filter(n => n);

    for (var i = 0; i < scell_infos.length; i++)
    {
        if (scell_infos[i] == "")
            continue;

        var scell_info = scell_infos[i].split(",");
        var have_scell_sig_info = scell_sig_infos.length > i;
        var scell_sig_info = have_scell_sig_info ? scell_sig_infos[i].split(",") : undefined;

        if (scell_info.length < 6)
            continue;

        if (have_scell_sig_info && scell_sig_info.length < 3)
            continue;

        lte_cells.push(new LteCaCellInfo(
            scell_info[1], // PCI
            "B" + scell_info[3], // Band
            scell_info[4], // Earfcn
            scell_info[5].replace(".0", ""), // Bandwidth
            "", // RSSI
            (have_scell_sig_info ? scell_sig_info[0] : "").replace("-44.0", "?????"), // RSRP
            "",
            "",
            "",
            have_scell_sig_info ? scell_sig_info[1] : "", // RSRQ
            have_scell_sig_info ? scell_sig_info[2] : "", // SINR
            "",
            "",
            ""));
    }

    return lte_cells;
}

class NrCaCellInfo
{
    constructor(pci, band, arfcn, bandwidth, rsrp1, rsrp2, rsrq, sinr)
    {
        this.pci = pci;
        this.band = band;
        this.arfcn = arfcn;
        this.bandwidth = bandwidth;
        this.rsrp1 = rsrp1;
        this.rsrp2 = rsrp2;
        this.rsrq = rsrq;
        this.sinr = sinr;
        this.unchanged_updates = 0;
        this.info_text = "";
    }
}
  
function parse_nr_cell_info()
{
    if (!is_5g)
        return [];

    if (is_5g_nsa && !is_5g_nsa_active)
    {
        // Base station is capable of 5G NSA
        // but we don't have any receipton of the NSA band.
        return [];
    }

    /*
     * There's apparently no better fix for this.
     * The API does not reset its memory correctly after switching from
     * 5G CA to 5G without CA.
     */ 
    var is_ca = nr_ca_pcell_freq == "" || nr5g_action_channel == nr_ca_pcell_freq;

    if (_5g_rx0_rsrp == "")
        _5g_rx0_rsrp = Z5g_rsrp;

    var nr_cells = [];

    var allowed_nr_bands = 
        (is_5g_nsa ? nr5g_nsa_band_lock : nr5g_sa_band_lock).split(",");

    if (!is_ca) {
        var nr_band =
            (is_5g_nsa ? "n" + nr5g_action_nsa_band : nr5g_action_band);

        if (nr_band == "n" || nr_band == "n-1")
            nr_band = "n??";

        nr_cells.push(new NrCaCellInfo(
            parseInt(nr5g_pci, 16),
            nr_band,
            nr5g_action_channel,
            is_5g_nsa ? "" : bandwidth.replace("MHz", ""),
            _5g_rx0_rsrp,
            _5g_rx1_rsrp,
            Z5g_rsrq,
            Z5g_SINR.replace("-20.0", "?????").replace("-3276.8", "?????")
        ));

        previous_nr_cells = nr_cells;
        return nr_cells;
    }

    var pcc_band = nr_ca_pcell_band != ""
    ? nr_ca_pcell_band
    : (nr5g_action_band != ""
        ? (nr5g_action_band[0] == 'n' || nr5g_action_band[0] == 'N'
            ? nr5g_action_band.substr(1)
            : nr5g_action_band)
        : "??");

    var pcc_freq = nr_ca_pcell_freq != ""
        ? nr_ca_pcell_freq
        : (nr5g_action_channel != ""
            ? nr5g_action_channel
            : "??");

    nr_cells.push(new NrCaCellInfo(
        parseInt(nr5g_pci, 16),
        "n" + pcc_band,
        pcc_freq,
        bandwidth == "" ? "" : bandwidth.replace("MHz", ""),
        _5g_rx0_rsrp,
        _5g_rx1_rsrp,
        Z5g_rsrq,
        Z5g_SINR.replace("-20.0", "?????").replace("-3276.8", "?????")
    ));

    nr_multi_ca_scell_info.split(";").forEach(cell => {
        if (cell == "")
            return;

        // 0,XX,1,n75,292330,30MHz,0,-73.3,-10.5,17.5;
        // 0  1 2   3      4     5 6     7     8    9
        var cell_data = cell.split(",");

        if (cell_data.length < 10)
            return;

        var nr_band = cell_data[3].replace("n", "");

        /*
         * Try to detect false data. See comment above.
         */
        if (allowed_nr_bands.indexOf(nr_band) == -1)
            return;
    
        nr_cells.push(new NrCaCellInfo(
            cell_data[1], // PCI
            cell_data[3], // Band
            cell_data[4], // Arfcn
            cell_data[5].replace("MHz", ""),
            cell_data[7], // RSRP
            "",
            cell_data[8], // RSRQ
            cell_data[9].replace("0.0", "?????") // SINR
        ));
    });

    /*
     * Try to detect false data. See comment above.
     * Only do this for SCells.
     */
    if (false && typeof previous_nr_cells !== "undefined" && nr_cells.length == previous_nr_cells.length)
    {
        for (var i = 1; i < nr_cells.length; i++)
        {
            if (nr_cells[i].rsrp1 == previous_nr_cells[i].rsrp1 && 
                nr_cells[i].sinr == previous_nr_cells[i].sinr)
            {
                nr_cells[i].unchanged_updates = previous_nr_cells[i].unchanged_updates + 1;
                if (nr_cells[i].unchanged_updates >= 30)
                    nr_cells[i].info_text = "[Data might be invalid]";
            }
        }
    }

    previous_nr_cells = nr_cells;
    return nr_cells;
}

function get_band_info(cells) 
{
    var bands = "";
    cells.forEach(cell => {
        var info = cell.band;
        if (cell.bandwidth != "") info += "(" + cell.bandwidth + "MHz)";
        bands += bands ? " + " : "";
        bands += info;
    });
    return bands;
}

function get_status()
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: siginfo,
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            for (signal = a, vars = siginfo.split(','), e = 0; e < vars.length; e++)
            {
                v = vars[e];
                window[(!isNaN(v[0]) ? "_" : "" ) + v] = a[v];
            }

            is_umts = (network_type == "HSPA" || network_type == "HSDPA" || network_type == "HSUPA" || network_type == "HSPA+" || network_type == "DC-HSPA+" || 
                       network_type == "UMTS" || network_type == "CDMA" || network_type == "CDMA_EVDO" || network_type == "EVDO_EHRPD" || network_type == "TDSCDMA");

            // MC801 = EN-DC, MC801A = ENDC
            is_lte = (network_type == "LTE" || network_type == "ENDC" || network_type == "EN-DC" || network_type == "LTE-NSA");
            is_lte_plus = (wan_lte_ca && (wan_lte_ca == "ca_activated" || wan_lte_ca == "ca_deactivated"));

            is_5g_sa = (network_type == "SA");
            is_5g_nsa = (network_type == "ENDC" || network_type == "EN-DC" || network_type == "LTE-NSA");
            is_5g_nsa_active = is_5g_nsa && network_type != "LTE-NSA";
            is_5g = is_5g_sa || is_5g_nsa;

            if (is_umts) $("#umts_signal_container").show();
            else $("#umts_signal_container").hide();

            if (is_lte_plus) $("#lte_ca_active_tr").show();
            else $("#lte_ca_active_tr").hide();

            if (network_provider_fullname != "") $("#provider").show();
            else $("#provider").hide();

            if (cell_id) {
                const decimalValue = parseInt(cell_id, 16);
                // Only show if conversion is valid
                if (!isNaN(decimalValue)) {
                    $("#cell").show();
                    $("#cell_id").text(decimalValue);
                    // Also update the global variable to be in decimal
                    window.cell_id = decimalValue.toString();
                } else {
                    console.error("Invalid hex value:", cell_id);
                    $("#cell").hide();
                }
            } else {
                $("#cell").hide();
            }


            if (is_5g && nr5g_cell_id) $("#5g_cell").show();
            else $("#5g_cell").hide();

            if (tx_power != "" && is_lte && !is_5g_nsa /* Prevent showing an outdated value from an LTE session */)
            {
                tx_power += " dBm (" + Math.pow(10, tx_power/10.0).toFixed(3) + " mW)";
                $("#txp").show();
            }
            else $("#txp").hide();
            
            $("#ca_active").html(wan_lte_ca && wan_lte_ca == "ca_activated" ? "&#10003;" : "&#10005;");

            /*
             * LTE Cell Info
             */

            var lte_cells = parse_lte_cell_info();

            var2html("__lte_signal", lte_cells);

            for (var i = 0; i < 6; i++)
            {
                var cell_num = i + 1;
                if (is_lte && lte_cells.length > i)
                {
                    var lte_cell = lte_cells[i];
                    if (lte_cell.rsrp1 != "")
                    {
                        $("#lte_" + cell_num + "_rsrp").show();
                        $("#lte_" + cell_num + "_sinr").show();
                        $("#lte_" + cell_num + "_rsrq").show();
                    }
                    else
                    {
                        $("#lte_" + cell_num + "_rsrp").hide();
                        $("#lte_" + cell_num + "_sinr").hide();
                        $("#lte_" + cell_num + "_rsrq").hide();
                    }
                    $("#lte_" + cell_num).show();
                }
                else $("#lte_" + cell_num).hide();
            }

            var lte_bands = get_band_info(lte_cells);

            /*
             * LTE Cell Info End
             */

            /* 
             * NR Cell Info
             */

            var nr_cells = parse_nr_cell_info();

            var2html("__nr_signal", nr_cells);
        
            for (var i = 1; i <= 3; i++)
            {
                if (is_5g && nr_cells.length >= i) $("#5g_" + i).show();
                else $("#5g_" + i).hide();
            }

            if (nr_cells.length > 0)
            {
                if (nr_cells[0].rsrp2 != "") $("#5g_1_rsrp2").show();
                else $("#5g_1_rsrp2").hide();

                // Not available with NSA
                if (nr_cells[0].bandwidth != "") $("#5g_1_bandwidth").show();
                else $("#5g_1_bandwidth").hide();
            }

            var nr_bands = get_band_info(nr_cells);
            
            /*
             * NR Cell Info End
             */

            /*
             * Band info
             */

            var bandinfo = lte_bands;

            if (nr_bands != "")
            {
                if (bandinfo != "") bandinfo += " + ";
                bandinfo += nr_bands;
            }

            if (bandinfo != "")
            {
                $("#__bandinfo").html(bandinfo);
                $("#bandinfo").show();
            }
            else $("#bandinfo").hide();

            /*
             * Band info end
             */

            if (is_umts && lte_ca_pcell_band)
                $("#umts_signal_table_main_band").html(" (" + lte_ca_pcell_band + ")");

            if (ngbr_cell_info)
            {
                if (is_lte)
                {
                    var ngbr_cells = ngbr_cell_info.split(";");
                    if (ngbr_cells.length > 0)
                    {
                        var html = "<table class='ngbr_cell_table'>";
                        for (var i = 0; i < ngbr_cells.length; i++) {
                            var cell = ngbr_cells[i];
                            if (!cell) continue; // Skip empty entries
                        
                            var parts = cell.split(",").map(part => part.trim());
                            if (parts.length === 5) {
                                var [earfcn, pci, rsrq, rsrp, rssi] = parts;
                                html += `<tr><td>${pci}:${earfcn}</td><td>RSRP: ${rsrp} dBm&nbsp;</td><td>RSRQ: ${rsrq} dB&nbsp;</td><td>RSSI: ${rssi} dBm</td></tr>`;
                            } else {
                                console.error("Invalid cell data format:", cell);
                            }
                        }
                        html += "</table>";
                    }
                    ngbr_cell_info = html;
                }
                else
                {
                    ngbr_cell_info = ngbr_cell_info.replace(";", "<br>");
                }

                $("#ngbr_cells").show();
            }
            else
            {
                $("#ngbr_cells").hide();
            }

            if (wan_ipaddr) $("#wanipinfo").show();
            else $("#wanipinfo").hide();

            if (pm_sensor_ambient || pm_sensor_mdm || pm_sensor_5g || pm_sensor_pa1 || wifi_chip_temp)
            {
                var temp = "";
                if (pm_sensor_ambient && pm_sensor_ambient > -40) temp += (temp ? "&nbsp;&nbsp;" : "") + "A:&nbsp;" + pm_sensor_ambient + "°c";
                if (pm_sensor_mdm && pm_sensor_mdm > -40) temp += (temp ? "&nbsp;&nbsp;" : "") + "M:&nbsp;" + pm_sensor_mdm + "°c";
                if (pm_sensor_5g && pm_sensor_5g > -40) temp += (temp ? "&nbsp;&nbsp;" : "") + "5G:&nbsp;" + pm_sensor_mdm + "°c";
                if (pm_sensor_pa1 && pm_sensor_pa1 > -40) temp += (temp ? "&nbsp;&nbsp;" : "") + "P:&nbsp;" + pm_sensor_pa1 + "°c";
                if (wifi_chip_temp && wifi_chip_temp > -40) temp += (temp ? "&nbsp;&nbsp;" : "") + "W:&nbsp;" + wifi_chip_temp + "°c";
                $("#temps").html(temp);
                $("#temperature").show();
            } 
            else $("#temperature").hide();

            for (e = 0; e < vars.length; e++)
            {
                v = vars[e];
                v = (!isNaN(v[0]) ? "_" : "" ) + v;
                $("#" + v).html(window[v]);
            }
        }
    })
}

function err(a, e, n)
{
    alert("Communication Error"), console.log(a), console.log(e), console.log(n)
}

function set_net_mode(mode = null)
{
    var modes = [
        "Only_GSM",
        "Only_WCDMA",
        "Only_LTE",
        "WCDMA_AND_GSM",
        "WCDMA_preferred",
        "WCDMA_AND_LTE",
        "GSM_AND_LTE",
        "CDMA_EVDO_LTE",
        "Only_TDSCDMA",
        "TDSCDMA_AND_WCDMA",
        "TDSCDMA_AND_LTE",
        "TDSCDMA_WCDMA_HDR_CDMA_GSM_LTE",
        "TDSCDMA_WCDMA_GSM_LTE",
        "GSM_WCDMA_LTE",
        "Only_5G",
        "LTE_AND_5G",
        "GWL_5G",
        "TCHGWL_5G",
        "WL_AND_5G",
        "TGWL_AND_5G",
        "4G_AND_5G"
    ];

    mode = mode || prompt("Enter one of\n" + modes.join(", "), "WL_AND_5G");
    if (!mode) return;

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD);
            $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data:
                {
                    isTest: "false",
                    goformId: "SET_BEARER_PREFERENCE",
                    BearerPreference: mode,
                    AD: ad
                },
                success: function(a)
                {
                    console.log(a);
                    j = JSON.parse(a);
                    if ("success" != j.result)
                        alert("Setting mode to '" + mode + "' failed");
                },
                error: err
            })
        }
    })

}

function lte_cell_lock(reset = false) {
    var lockParameters;

    if (reset) {
        lockParameters = ["0", "0"];
    } else {
        var defaultPciEarfcn = parseInt(lte_pci, 16) + "," + wan_active_channel;
        var cellLockDetails = prompt("Please input PCI,EARFCN, separated by ',' char (example 116,3350). "+ 
                                     "Leave default for lock on current main band.", defaultPciEarfcn);

        if (cellLockDetails === null || cellLockDetails.trim() === "") {
            return;
        }

        var inputValues = cellLockDetails.split(",");
        var pciIsValid = !isNaN(inputValues[0]) && Number.isInteger(parseFloat(inputValues[0]));
        var earfcnIsValid = !isNaN(inputValues[1]) && Number.isInteger(parseFloat(inputValues[1]));

        if (!pciIsValid || !earfcnIsValid) {
            alert("Invalid input. Please ensure all values are correctly formatted.");
            return;
        }

        lockParameters = inputValues;
    }

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data: {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a) {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD);
            $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data: {
                    isTest: "false",
                    goformId: "LTE_LOCK_CELL_SET",
                    lte_pci_lock: lockParameters[0],
                    lte_earfcn_lock: lockParameters[1],
                    AD: ad
                },
                success: function(a) {
                    var response = JSON.parse(a);
                    if (response.result === "success") {

                        var rebootMessage = 
                            "You have to reboot your Router in order " + 
                            (reset ? "to remove the cell lock" : "for the cell lock to be active") + ".\n\nReboot now?";

                        if (confirm(rebootMessage)) {
                            reboot(true);
                        }
                    } else {
                        alert("Error.");
                    }
                },
                error: function(err) {
                    console.error(err);
                    alert("An error occurred while attempting to lock the cell.");
                }
            });
        }
    });
}

function nr_cell_lock(reset = false) {
    var cellLockDetails;

    if (reset) {
        cellLockDetails = "0,0,0,0";
    } else {
        var nrCellInfo = parse_nr_cell_info();
        var defaultCellDetails = "";

        if (nrCellInfo.length > 0) {
            var primaryNrCell = nrCellInfo[0];
            defaultCellDetails = primaryNrCell.pci + ',' + primaryNrCell.arfcn + ',' + primaryNrCell.band.replace('n', '') + ',' + "30";
        }

        cellLockDetails = prompt("Please input PCI,ARFCN,BAND,SCS separated by ',' char (example 202,639936,78,30). " + 
                                 "Leave default for locking the current NR primary band. You may need to adjust the SCS.", defaultCellDetails);

        if (cellLockDetails === null || cellLockDetails.trim() === "") {
            return;
        } else {
            var inputValues = cellLockDetails.split(",");

            var pciIsValid = !isNaN(inputValues[0]) && Number.isInteger(parseFloat(inputValues[0]));
            var arfcnIsValid = !isNaN(inputValues[1]) && Number.isInteger(parseFloat(inputValues[1]));
            var bandIsValid = !isNaN(inputValues[2]) && Number.isInteger(parseFloat(inputValues[2]));
            var scsIsValid = ["15", "30", "60", "120", "240"].includes(inputValues[3]);

            if (!pciIsValid || !arfcnIsValid || !bandIsValid || !scsIsValid) {
                alert("Invalid input. Please ensure all values are correctly formatted.");
                return;
            }
        }
    }

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data: {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a) {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD);
            $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data: {
                    isTest: "false",
                    goformId: "NR5G_LOCK_CELL_SET",
                    nr5g_cell_lock: cellLockDetails,
                    AD: ad
                },
                success: function(a) {
                    var response = JSON.parse(a);
                    if (response.result === "success") {

                        var rebootMessage = 
                            "You have to reboot your Router in order " + 
                            (reset ? "to remove the cell lock" : "for the cell lock to be active")+ ".\n\nReboot now?";

                        if (confirm(rebootMessage)) {
                            reboot(true);
                        }
                    } else {
                        alert("Error.");
                    }
                },
                error: function(err) {
                    console.error(err);
                    alert("An error occurred while attempting to lock the cell.");
                }
            });
        }
    });
}

function lte_band_selection(a = null, nested_attempt_with_dev_login = false)
{
    a = a || prompt("Please input LTE bands number, separated by + char (example 1+3+20). If you want to use every supported band, write 'AUTO'.", "AUTO");

    var had_admin_password_hash = have_admin_password_hash();

    if (null != (a = a && a.toLowerCase()) && "" !== a)
    {
        var e = a.split("+");
        var n = 0;
        var all_bands = "0xA3E2AB0908DF";

        if ("AUTO" === a.toUpperCase())
        {
            n = all_bands;
        }
        else
        {
            for (var l = 0; l < e.length; l++) n += Math.pow(2, parseInt(e[l]) - 1);
            n = n.toString(16);
            n = "0x" + (Math.pow(10, 11 - n.length) + n + "").substr(1);
        }

        $.ajax({
            type: "GET",
            url: "/goform/goform_get_cmd_process",
            data:
            {
                cmd: "wa_inner_version,cr_version,RD",
                multi_data: "1"
            },
            dataType: "json",
            success: function(a)
            {
                ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                    type: "POST",
                    url: "/goform/goform_set_cmd_process",
                    data:
                    {
                        isTest: "false",
                        goformId: "BAND_SELECT",
                        is_gw_band: 0,
                        gw_band_mask: 0,
                        is_lte_band: 1,
                        lte_band_mask: n,
                        AD: ad
                    },
                    success: function(a)
                    {
                        console.log(a);

                        var j = JSON.parse(a);
   
                        if ("success" == j.result)
                        {
                            if (nested_attempt_with_dev_login)
                            {
                                if (!had_admin_password_hash)
                                    alert("Successfully performed LTE band lock with developer login ...");
                            }
                        }
                        else
                        {
                            if (!nested_attempt_with_dev_login && !logged_in_as_developer)
                            {
                                if (!had_admin_password_hash)
                                {
                                    alert("LTE band locking failed.\n\n" +
                                          "Your device model may require to log in as developer\n" + 
                                          "in order to be able to lock LTE bands.");
                                }

                                perform_login(
                                    function() {
                                        logged_in_as_developer = true;
                                        lte_band_selection(a, true);
                                    }, true);
                            }
                            else
                            {
                                alert("LTE band locking with developer login still failed.\nThere might be something else wrong.");
                            }
                        }
                    },
                    error: err
                })
            }
        })
    }
}

function nr_band_selection(a)
{
    var e;
    var a = a || prompt("Please input 5G bands number, separated by + char (example 3+78). If you want to use every supported band, write 'AUTO'.", "AUTO");

    null != a && "" !== a && (e = a.split("+").join(","));
    "AUTO" === a.toUpperCase() && (e = "1,2,3,5,7,8,20,28,38,41,50,51,66,70,71,74,75,76,77,78,79,80,81,82,83,84");

    $.ajax({
            type: "GET",
            url: "/goform/goform_get_cmd_process",
            data:
            {
                cmd: "wa_inner_version,cr_version,RD",
                multi_data: "1"
            },
            dataType: "json",
            success: function(a)
            {
                ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                    type: "POST",
                    url: "/goform/goform_set_cmd_process",
                    data:
                    {
                        isTest: "false",
                        goformId: "WAN_PERFORM_NR5G_BAND_LOCK",
                        nr5g_band_mask: e,
                        AD: ad
                    },
                    success: function(a)
                    {
                        console.log(a);
                    },
                    error: err
                })
            }
    });
}

function bridge_mode(enable)
{
    if (!confirm((enable ? "Enable" : "Disable") + " bridge mode and reboot router?"))
        return;

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data:
                {
                    isTest: "false",
                    goformId: "OPERATION_MODE",
                    opMode:	(enable ? "LTE_BRIDGE" : "PPP"),
                    ethernet_port_specified: "1",
                    AD: ad
                },
                success: function(a)
                {
                    console.log(a);
                    alert("Successfully " + (enable ? "enabled" : "disabled") + " bridge mode! Rebooting ..." +
                          (enable ? "\n\nIf your device has multiple LAN port then the lower one\nis the WAN/bridge port!" : ""));
                    reboot(true);
                },
                error: err
            })
        }
    })
}

function arp_proxy(enable)
{
    if (!confirm((enable ? "Enable" : "Disable") + " ARP proxy and reboot router?"))
        return;

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data:
                {
                    isTest: "false",
                    goformId: "ARP_PROXY_SWITCH",
                    arp_proxy_switch: enable ? 1 : 0,
                    AD: ad
                },
                success: function(a)
                {
                    console.log(a);
                    alert((enable ? "Enabled" : "Disabled") + " ARP proxy!");
                    reboot(true);
                },
                error: err
            })
        }
    })
}

function reboot(force = false)
{
    if (!force && !confirm("Reboot Router?"))
        return

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data:
                {
                    isTest: "false",
                    goformId: "REBOOT_DEVICE",
                    AD: ad
                },
                success: function(a)
                {
                    console.log(a);
                    if (!force) alert("Rebooting ...");
                },
                error: err
            })
        }
    })
}

function version_info()
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "hardware_version,web_version,wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a)
        {
            v = "HW version: " + a.hardware_version + "\nWEB version: " + a.web_version + "\nWA INNER version: " + a.wa_inner_version;
            alert(v);
        }
    })
}

function inject_main_container_if_missing() {
    // Newer models like the MC888 Ultra don't have a main container anymore.
    // Inject a fake one to get the script working.

    if (!$("#mainContainer").length) {
        $("body").prepend(`
            <div id="mainContainer" align="center">
                <style>
                    #mainContainer table {
                        margin: 0 auto;
                        text-align: left;
                    }
                    #mainContainer a {
                        color: #007bff;
                        text-decoration: none;
                        cursor: pointer;
                    }
                    #mainContainer a:hover {
                        text-decoration: underline;
                    }
                </style>
            </div>
        `);
    }
}

function inject_html()
{
    inject_main_container_if_missing();

    $(".color_background_blue").css("background-color", "#456");
    $(".headcontainer").hide();

    $("#mainContainer").prepend(`
    <style>
        
    .clear {
        clear: both;
    }
    
    li span {
        margin-left: 5px;
    }

    .f {
        /*float: left;*/
        border: 1px solid #bbb;
        border-radius: 5px;
        padding: 10px;
        line-height: 2em;
        margin: 5px;
    }
    
    .f ul {
        margin: 0;
        padding: 0;
    }
    
    .f ul li {
        display: inline;
        margin-right: 5px;
        margin-left: 5px;
    }
    
    .p {
        border-bottom: 1px solid #ccc;
        width: auto;
        height: 20px;
    }
    
    .v {
        height: 100%25;
        border-right: 1px solid #ccc;
    }
    
    .sb {
        padding: 10px;
        border-radius: 10px;
        display: inline-block;
        margin: 10px 0 10px 10px;
    }
    
    .v {
        padding-left: 20px;
    }

    .mod_border {
        border-radius: 5px;
        border-style: hidden;
        box-shadow: 0 0 0 3px #999;
    }

    .mod_container {
        width: 940px;
        border: 4px solid #40adf5;
        border-radius: 10px;
        padding: 5px;
        font-family: Verdana;
        font-size: 13px;
    }

    .inner_mod_container {
        width: 600px;
        margin: 0 auto;
    }

    .mod_table {
        all: revert;
        border-collapse: collapse;

        border-radius: 5px;
        border-style: hidden;
        box-shadow: 0 0 0 3px #999;
    }

    .mod_table td {
        border: 3px solid #999;
        padding: 5px;
        border-radius: 20px;
    }

    .ngbr_cell_table {
        all: revert;
        border: none;
    }

    .ngbr_cell_table td {
        all: revert;
        border: none;
    }

    .signal_table {
        width: 100%;
    }

    .signal_table td {
        width: 75px;
    }

    .cellinfo_table {
        width: 100%;
        table-layout: fixed;
    }


    .spacing {
        padding: 10px;
    }

    .spacing_small {
        padding: 5px;
    }

    .spacing_links {
        padding: 1px;
    }

    .links_container {
        font-size: 14px;
        text-align: left;
    }

    </style>

    <div class="mod_container">
        <div class="spacing_small"></div>

        <div class="inner_mod_container">
            <!-- LTE Primary -->
            <div id="lte_1">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='4' style='text-align:center'>LTE (<span id="__lte_signal_0_band"></span>)</td>
                    </tr>
                    <tr>
                        <td>RSRP1:</td>
                        <td><span id="__lte_signal_0_rsrp1"></span> dBm</td>
                        <td>SINR1:</td>
                        <td><span id="__lte_signal_0_sinr1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRP2:</td>
                        <td><span id="__lte_signal_0_rsrp2"></span> dBm</td>
                        <td>SINR2:</td>
                        <td><span id="__lte_signal_0_sinr2"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRP3:</td>
                        <td><span id="__lte_signal_0_rsrp3"></span> dBm</td>
                        <td>SINR3:</td>
                        <td><span id="__lte_signal_0_sinr3"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRP4:</td>
                        <td><span id="__lte_signal_0_rsrp4"></span> dBm</td>
                        <td>SINR4:</td>
                        <td><span id="__lte_signal_0_sinr4"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRQ:</td>
                        <td><span id="__lte_signal_0_rsrq"></span> dB</td>
                        <td>RSSI:</td>
                        <td><span id="__lte_signal_0_rssi"></span> dBm</td>
                    </tr>
                    <tr id="lte_1_earfcn">
                        <td colspan='2'>EARFCN:</td>
                        <td colspan='2'><span id="__lte_signal_0_earfcn"></span></td>
                    </tr>
                    <tr>
                        <td colspan='2'>PCI:</td>
                        <td colspan='2'><span id="__lte_signal_0_pci"></span></td>
                    </tr>    
                    <tr>
                        <td colspan='2'>BW:</td>
                        <td colspan='2'><span id="__lte_signal_0_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>

            <div id="lte_2">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>LTE (<span id="__lte_signal_1_band"></span>)</td>
                    </tr>
                    <tr id="lte_2_rsrp">
                        <td>RSRP:</td>
                        <td><span id="__lte_signal_1_rsrp1"></span> dBm</td>
                    </tr>
                    <tr id="lte_2_sinr">
                        <td>SINR:</td>
                        <td><span id="__lte_signal_1_sinr1"></span> dB</td>
                    </tr>
                    <tr id="lte_2_rsrq">
                        <td>RSRQ:</td>
                        <td><span id="__lte_signal_1_rsrq"></span> dB</td>
                    </tr>
                    <tr id="lte_2_earfcn">
                        <td>EARFCN:</td>
                        <td><span id="__lte_signal_1_earfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__lte_signal_1_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__lte_signal_1_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>
            <div id="lte_3">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>LTE (<span id="__lte_signal_2_band"></span>)</td>
                    </tr>
                    <tr>
                        <td>RSRP:</td>
                        <td><span id="__lte_signal_2_rsrp1"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__lte_signal_2_sinr1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRQ:</td>
                        <td><span id="__lte_signal_2_rsrq"></span> dB</td>
                    </tr>
                    <tr id="lte_3_earfcn">
                        <td>EARFCN:</td>
                        <td><span id="__lte_signal_2_earfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__lte_signal_2_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__lte_signal_2_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>
            <div id="lte_4">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>LTE (<span id="__lte_signal_3_band"></span>)</td>
                    </tr>
                    <tr>
                        <td>RSRP:</td>
                        <td><span id="__lte_signal_3_rsrp1"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__lte_signal_3_sinr1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRQ:</td>
                        <td><span id="__lte_signal_3_rsrq"></span> dB</td>
                    </tr>
                    <tr id="lte_4_earfcn">
                        <td>EARFCN:</td>
                        <td><span id="__lte_signal_3_earfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__lte_signal_3_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__lte_signal_3_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>
            <div id="lte_5">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>LTE (<span id="__lte_signal_4_band"></span>)</td>
                    </tr>
                    <tr>
                        <td>RSRP:</td>
                        <td><span id="__lte_signal_4_rsrp1"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__lte_signal_4_sinr1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRQ:</td>
                        <td><span id="__lte_signal_4_rsrq"></span> dB</td>
                    </tr>
                    <tr id="lte_5_earfcn">
                        <td>EARFCN:</td>
                        <td><span id="__lte_signal_4_earfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__lte_signal_4_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__lte_signal_4_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>
            <div id="lte_6">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>LTE (<span id="__lte_signal_5_band"></span>)</td>
                    </tr>
                    <tr>
                        <td>RSRP:</td>
                        <td><span id="__lte_signal_5_rsrp1"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__lte_signal_5_sinr1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRQ:</td>
                        <td><span id="__lte_signal_5_rsrq"></span> dB</td>
                    </tr>
                    <tr id="lte_6_earfcn">
                        <td>EARFCN:</td>
                        <td><span id="__lte_signal_5_earfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__lte_signal_5_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__lte_signal_5_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>


            <div id="umts_signal_container">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='4' style='text-align:center'>UMTS<span id="umts_signal_table_main_band"></span></td>
                    </tr>
                    <tr>
                        <td>RSCP1:</td>
                        <td><span id="rscp_1"></span> dBm</td>
                        <td>ECIO1:</td>
                        <td>-<span id="ecio_1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSCP2:</td>
                        <td><span id="rscp_2"></span> dBm</td>
                        <td>ECIO2:</td>
                        <td>-<span id="ecio_2"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSCP3:</td>
                        <td><span id="rscp_3"></span> dBm</td>
                        <td>ECIO3:</td>
                        <td>-<span id="ecio_3"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSCP4:</td>
                        <td><span id="rscp_4"></span> dBm</td>
                        <td>ECIO4:</td>
                        <td>-<span id="ecio_4"></span> dB</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>          
    
            <!-- NR Primary -->
            <div id="5g_1">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>
                            5G (<span id="__nr_signal_0_band"></span>)
                            <span id="__nr_signal_0_info_text"></span>
                        </td>
                    </tr>
                    <tr>
                        <td>RSRP1:</td>
                        <td><span id="__nr_signal_0_rsrp1"></span> dBm</td>
                    </tr>
                    <tr id="5g_1_rsrp2">
                        <td>RSRP2:</td>
                        <td><span id="__nr_signal_0_rsrp2"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__nr_signal_0_sinr"></span> dB</td>
                    </tr>
                    <tr id="5g_1_arfcn">
                        <td>ARFCN:</td>
                        <td><span id="__nr_signal_0_arfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__nr_signal_0_pci"></span></td>
                    </tr>
                    <tr id="5g_1_bandwidth">
                        <td>BW:</td>
                        <td><span id="__nr_signal_0_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>

            <div id="5g_2">
                <!-- NR Scell1 -->
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>
                            5G (<span id="__nr_signal_1_band"></span>)
                            <span id="__nr_signal_1_info_text"></span>
                        </td>
                    </tr>
                    <tr>
                        <td>RSRP:</td>
                        <td><span id="__nr_signal_1_rsrp1"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__nr_signal_1_sinr"></span> dB</td>
                    </tr>
                    <tr id="5g_2_arfcn">
                        <td>ARFCN:</td>
                        <td><span id="__nr_signal_1_arfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__nr_signal_1_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__nr_signal_1_bandwidth"></span> MHz</td>
                    </tr>
                </table>
                <div class="spacing"></div>
            </div>
            <div id="5g_3">
                <!-- NR Scell2 -->
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>
                            5G (<span id="__nr_signal_2_band"></span>)
                            <span id="__nr_signal_2_info_text"></span>
                        </td>
                    </tr>
                    <tr>
                        <td>RSRP:</td>
                        <td><span id="__nr_signal_2_rsrp1"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="__nr_signal_2_sinr"></span> dB</td>
                    </tr>
                    <tr id="5g_3_arfcn">
                        <td>ARFCN:</td>
                        <td><span id="__nr_signal_2_arfcn"></span></td>
                    </tr>
                    <tr>
                        <td>PCI:</td>
                        <td><span id="__nr_signal_2_pci"></span></td>
                    </tr>
                    <tr>
                        <td>BW:</td>
                        <td><span id="__nr_signal_2_bandwidth"></span> MHz</td>
                    </tr>
                </table>

                <div class="spacing"></div>
            </div>

            <div>    
                <table class="mod_table cellinfo_table">
                    <tr id="provider">
                        <td>PROVIDER:</td>
                        <td><span id="network_provider_fullname"></span></td>
                    </tr>
                    <tr id="cell">
                        <td>CELL:</td>
                        <td><span id="cell_id"></span></td>
                    </tr>
                    <tr id="5g_cell">
                        <td>5G CELL:</td>
                        <td><span id="nr5g_cell_id"></span></td>
                    </tr>
                    <tr id="ngbr_cells">
                        <td>NGBR:</td>
                        <td><span id="ngbr_cell_info"></span></td>
                    </tr>
                    <tr id="txp">
                        <td>TX POWER:</td>
                        <td><span id="tx_power"></span></td>
                    </tr>
                    <tr>
                        <td>CONNECTION:</td>
                        <td><span id="network_type"></span></td>
                    </tr>
                    <tr id="bandinfo">
                        <td>BANDS:</td>
                        <td>
                            <span id="__bandinfo">
                        </td>
                    </tr>
                    <tr id="lte_ca_active_tr">
                        <td>LTE CA ACTIVE:</td>
                        <td><span id="ca_active"></span></td>
                    </tr>
                    <tr id="wanipinfo">
                        <td>WAN IP:</td>
                        <td><span id="wan_ipaddr"></span></td>
                    </tr>
                    <tr id="temperature">
                        <td>TEMP:</td>
                        <td id="temps"></td>
                    </tr>
                </table>
            </div>

        </div>

        <div class="spacing"></div>

        <div class="inner_mod_container mod_border links_container">
            <a onclick="set_net_mode()">Network Mode</a>
            [
                <a onclick="set_net_mode('WL_AND_5G')">Auto</a> |
                <a onclick="set_net_mode('Only_5G')">5G SA</a> |
                <a onclick="set_net_mode('LTE_AND_5G')">5G NSA</a> |
                <a onclick="set_net_mode('4G_AND_5G')">5G SA/NSA/LTE</a> |
                <a onclick="set_net_mode('Only_LTE')">LTE</a> |
                <a onclick="set_net_mode('Only_WCDMA')">3G</a> |
                <a onclick="set_net_mode('Only_GSM')">2G</a>
            ]
            
            <div class="spacing_links"></div>

            <div id="lte_band_selection">
                <a onclick="lte_band_selection()">LTE Bands</a>
                [
                    <a onclick="lte_band_selection('AUTO')">Auto</a> |
                    <a onclick="lte_band_selection('1')">B1</a> |
                    <a onclick="lte_band_selection('3')">B3</a> |
                    <a onclick="lte_band_selection('7')">B7</a> |
                    <a onclick="lte_band_selection('8')">B8</a> |
                    <a onclick="lte_band_selection('20')">B20</a> |
                    <a onclick="lte_band_selection('1+3')">B1+B3</a> |
                    <a onclick="lte_band_selection('1+3+7')">B1+B3+B7</a>
                ]

                <div class="spacing_links"></div>
            </div>

            <a onclick="nr_band_selection()">5G Bands</a>
            [
                <a onclick="nr_band_selection('AUTO')">Auto</a> |
                <a onclick="nr_band_selection('1')">N1</a> |
                <a onclick="nr_band_selection('3')">N3</a> |
                <a onclick="nr_band_selection('7')">N7</a> |
                <a onclick="nr_band_selection('28')">N28</a> |
                <a onclick="nr_band_selection('28,75')">N28+N75</a> |
                <a onclick="nr_band_selection('78')">N78</a> |
                <a onclick="nr_band_selection('78,28,75')">N78+N28+N75</a>
            ]

            <div class="spacing_links"></div>

            <a onclick="bridge_mode(true)">Enable bridge mode</a> | <a onclick="bridge_mode(false)">Disable bridge mode</a>

            <div class="spacing_links"></div>

            <a onclick="arp_proxy(true)">Enable ARP proxy</a> | <a onclick="arp_proxy(false)">Disable ARP proxy</a>

            <div class="spacing_links"></div>

            <a onclick="make_hidden_settings_visible()">Show hidden device settings</a>
            <div class="spacing_links"></div>

            <a onclick="enable_automatic_login()">Enable Automatic Login</a> | <a onclick="version_info()">Version Info</a>
            <div class="spacing_links"></div>

            <a onclick="lte_cell_lock()">LTE Cell Lock</a> <span id="lte_cell_lock"></span> |
            <a onclick="lte_cell_lock(true)">Remove LTE Cell Lock</a> <span id="undo_lte_cell_lock"></span> ||
            <a onclick="nr_cell_lock()">5G Cell Lock</a> <span id="nr_cell_lock"></span> |
            <a onclick="nr_cell_lock(true)">Remove 5G Cell Lock</a> <span id="undo_nr_cell_lock"></span>

            <div class="spacing_links"></div>

            Config: <a onclick="config_SHOW_APN_DNS()">APN DNS</a>
            
            <div class="spacing_links"></div>

            <a onclick="reboot()">Reboot Router</a>
            <br>
            
        </div>

        <div class="spacing_small"></div>
    </div>

    <div class="spacing"></div>
    `)
}

function set_config(key, value){
    if (typeof require.s.contexts._.defined["config/config"][key] === "undefined") {
        console.log("Config key not found, setting it anyway: " + key);
    } else {
        console.log("Previous config value: " + require.s.contexts._.defined["config/config"][key]);
    }
    console.log("Setting config: " + key + " to " + value);
    require.s.contexts._.defined["config/config"][key] = value;
}

function config_SHOW_APN_DNS(){
    const value = prompt("Show APN DNS settings? (true/false)", "true");
    set_config("SHOW_APN_DNS", value === "true");
}

prepare_1_timer_id = window.setInterval(prepare_1, 250);
prepare_1();

$("#change").prop("disabled", !1);

$("#umts_signal_container").hide();
for (var i = 1; i <= 3; i++) $("#5g_" + i).hide();
for (var i = 1; i <= 6; i++) $("#lte_" + i).hide();
$("#lte_ca_active_tr").hide();
$("#provider").hide();
$("#cell").hide();
$("#5g_cell").hide();
$("#ngbr_cells").hide();
$("#txp").hide();
$("#temperature").hide();
$("#wanipinfo").hide();
