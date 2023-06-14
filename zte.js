
/*
 * 
 * Original code by Miononno
 * https://www.youtube.com/watch?v=1kanq1w2DA0
 * 
 * Enhanced by unknown @ lteforum.at
 * 
 */

console.log("Loading ZTE Script v" + "2023-06-01-#1");

javascript: ftb();

siginfo =
    "wan_active_band,wan_active_channel,wan_lte_ca,wan_apn,wan_ipaddr," +
    "cell_id,dns_mode,prefer_dns_manual,standby_dns_manual,network_type," +

    "network_provider_fullname," +
    "rmcc,rmnc," +

    "bandwidth," +

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


hash = hex_md5;
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

function setRouterQuirks()
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data:
        {
            cmd: "hardware_version"
        },
        dataType: "json",
        success: function(a)
        {
            if (a.hardware_version == "") return;

            is_mc888 = a.hardware_version.indexOf("MC888") > -1;
            is_mc889 = a.hardware_version.indexOf("MC889") > -1;

            if (is_mc888 || is_mc889)
            {
                hash = SHA256;
            }
            else
            {
                hash = hex_md5;
            }

            window.clearInterval(router_quirks_interval_id);
        }
    })
}

function testCmd(cmd)
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

function makeHiddenSettingsVisible()
{
    alert("This option makes hidden device settings visible.\n" +
          "Hidden settings are marked with a '[hidden option]' suffix");

    window.setInterval(function() {
        Array.from(document.querySelectorAll('*')).forEach(el => {
            if (el.classList.contains("hide")) {
                el.classList.remove("hide");
                el.innerHTML += "&nbsp;[hidden option]";
            }
        })},
    1000);
}

function performDeveloperLogin(successCallback)
{
    password = prompt("Router Password");

    if (password == null) {
        return;
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
                    goformId: "DEVELOPER_OPTION_LOGIN",
                    password: SHA256(SHA256(password) + a.LD),
                    AD: ad
                },
                success: function(a)
                {
                    console.log(a);

                    var j = JSON.parse(a);
                    if ("0" == j.result) {
                        logged_in_as_developer = true;
                        if (successCallback) successCallback();
                    } else {
                        alert("Developer login failed!");
                    }
                },
                error: err
            });
        }
    });
}

function preventAutomaticLogout()
{
    $.ajax({
        type: "GET",
        url: "/tmpl/network/apn_setting.html?v=" + Math.round(+new Date() / 1000)
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
        lte_ca_pcell_freq, // Non-CA = ""
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
            parseInt(scell_info[1], 16), // PCI
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

    dump_variable(lte_cells);

    return lte_cells;
}

class NrCaCellInfo
{
    constructor(pci, band, earfcn, bandwidth, rsrp1, rsrp2, rsrq, sinr)
    {
        this.pci = pci;
        this.band = band;
        this.earfcn = earfcn;
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
     * The API does not reset it's memory correctly after switching from
     * 5G CA to 5G without CA.
     */ 
    var is_ca = nr5g_action_channel == nr_ca_pcell_freq;

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
            is_5g_nsa ? "" : nr5g_action_channel,
            is_5g_nsa ? "" : bandwidth.replace("MHz", ""),
            _5g_rx0_rsrp,
            _5g_rx1_rsrp,
            Z5g_rsrq,
            Z5g_SINR));

        previous_nr_cells = nr_cells;
        return nr_cells;
    }

    nr_cells.push(new NrCaCellInfo(
        parseInt(nr5g_pci, 16),
        "n" + (nr_ca_pcell_band != "" ? nr_ca_pcell_band : "??"),
        nr_ca_pcell_freq,
        bandwidth.replace("MHz", ""),
        _5g_rx0_rsrp,
        _5g_rx1_rsrp,
        Z5g_rsrq,
        Z5g_SINR.replace("-20.0", "?????")
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
            cell_data[4], // Earfcn
            cell_data[5].replace("MHz", ""),
            cell_data[7], // RSRP
            "",
            cell_data[8], // RSRQ
            cell_data[9].replace("0.0", "???") // SINR
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

function getStatus()
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

            if (cell_id) $("#cell").show();
            else $("#cell").hide();

            if (is_5g && nr5g_cell_id) $("#5g_cell").show();
            else $("#5g_cell").hide();
            
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
                        for (var i = 0; i < ngbr_cells.length; i++)
                        {
                            var cell = ngbr_cells[i];
                            var [freq, pci, rsrq, rsrp, rssi] = cell.split(",");
                            html += "<tr><td>"+ pci + ":</td><td>RSRP: " + rsrp + " dBm&nbsp;</td><td>RSRQ: " + rsrq + " dB</td></tr>";
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

function setnetmode(mode = null)
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

function lockcell(e, n)
{
    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process",
        data: {
            cmd: "wa_inner_version,cr_version,RD",
            multi_data: "1"
        },
        dataType: "json",
        success: function(a) {
            ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                type: "POST",
                url: "/goform/goform_set_cmd_process",
                data: {
                    isTest: "false",
                    goformId: "LTE_LOCK_CELL_SET",
                    lte_pci_lock: e,
                    lte_earfcn_lock: n,
                    AD: ad
                },
                success: function(a) {
                    console.log(a), j = JSON.parse(a), "success" == j.result ? alert("Now you have to Reboot!") : alert("Error. Modem didn't like it!")
                },
                error: err
            })
        }
    })
}

function cslock()
{
    c = parseInt(lte_pci, 16) + "," + wan_active_channel;
    var a = prompt("Please input PCI,EARFCN, separated by ',' char (example 116,3350). Leave default for lock on current main band.", c);
    null != a && "" !== a && (a = a.split(","), "YES" == prompt("If you cell lock, you have to RESET your router to take the lock away! If you are sure, type YES (UPPERCASE)") && lockcell(a[0], a[1]))
}

function ltebandselection(a = null, nested_attempt_with_dev_login = false)
{
    a = a || prompt("Please input LTE bands number, separated by + char (example 1+3+20). If you want to use every supported band, write 'AUTO'.", "AUTO");

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
   
                        if ("success" == j.result) {
                            if (nested_attempt_with_dev_login) {
                                alert("Successfully performed LTE band lock with developer login ...");
                            }
                        } else {
                            if (!nested_attempt_with_dev_login && !logged_in_as_developer) {
                                alert("LTE band locking failed.\n\n" +
                                      "Your device model may require to log in as developer\n" + 
                                      "in order to be able to lock LTE bands.");

                                performDeveloperLogin(function() { ltebandselection(a, true); });
                            } else {
                                alert("LTE band locking still failed. There might be something else wrong.");    
                            }
                        }
                    },
                    error: err
                })
            }
        })
    }
}

function nrbandselection(a)
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
                        console.log(a)
                    },
                    error: err
                })
            }
    });
}

function reboot()
{
    if (!confirm("Reboot Router?"))
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
                    alert("Rebooting ...");
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

function band_info()
{
    ca_txt = wan_active_band + " - PCI,EARFCN:" + parseInt(lte_pci, 16) + "," + wan_active_channel;

    if ("" != signal.lte_multi_ca_scell_info)
    {
        ca_v = signal.lte_multi_ca_scell_info.slice(0, -1).split(";");
        for (var a = 0; a < ca_v.length; a++)
        {
            d = ca_v[a].split(",");
            b = d[3];
            e = d[4];
            p = d[1];
            ca_txt += "\nB" + b + " - PCI,EARFCN:" + p + "," + e;
        }
    }
    ca_txt += "\n\n" + nr5g_action_band + " - PCI:" + parseInt(nr5g_pci, 16) + " - EARFCN:" + nr5g_action_channel;
    alert(ca_txt);
}

function setdns(a)
{
    var e;

    var a = a || prompt("Please input 2 dns servers, separated by \",\"  (example 1.1.1.1,1.0.0.1). If you want to use PROVIDER settings, write 'AUTO'.", "AUTO");

    if (!a) return;
    a = a.toLowerCase();

    var dns_mode;

    if (a == "auto")
    {
        dns_mode = "auto";
        e = [ '0.0.0.0', '0.0.0.0' ];
    }
    else
    {
        dns_mode = "manual";
        e = a.split(",");
    }

    var cmd = "apn_interface_version,profile_name_ui";
    for (var i = 0; i <= 19; ++i)
        cmd += ",APN_config" + i;

    $.ajax({
        type: "GET",
        url: "/goform/goform_get_cmd_process?isTest=false",
        data: {
            isTest: "false",
            cmd: cmd,
            multi_data: "1"
        },
        dataType: "json",
        success: function(a) {        
            apn_interface_version = a["apn_interface_version"];

            if (apn_interface_version != 2)
            {
                alert("APN interface version " + apn_interface_version + " not supported. Expected version 2.");
                return;
            }

            var default_apn_name = a["profile_name_ui"];
            var ppp_auth_mode = "none";
            var ppp_username = "";
            var ppp_passwd = "";

            for (var i = 0; i <= 19; ++i)
            {
                var apn = a["APN_config" + i];
                if (apn === undefined || apn == "") break;
                apn = apn.split('($)');
                var apn_name = apn[0];
                if (apn_name == default_apn_name)
                {
                    ppp_auth_mode = apn[4];
                    ppp_username = apn[5];
                    ppp_passwd = apn[6];
                    break;
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
                    ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                        type: "POST",
                        url: "/goform/goform_set_cmd_process",
                        data: {
                            isTest: "false",
                            goformId: "APN_PROC_EX",
                            wan_apn: signal.wan_apn,
                            profile_name: "manual_dns",
                            apn_action: "save",
                            apn_mode: "manual",
                            pdp_type: "IP",
                            ppp_auth_mode: ppp_auth_mode,
                            ppp_username: ppp_username,
                            ppp_passwd: ppp_passwd,
                            dns_mode: dns_mode,
                            prefer_dns_manual: e[0],
                            standby_dns_manual: e[1],
                            index: 1,
                            AD: ad
                        },
                        success: function(a) {
                            $.ajax({
                                type: "GET",
                                url: "/goform/goform_get_cmd_process",
                                data: {
                                    cmd: "wa_inner_version,cr_version,RD",
                                    multi_data: "1"
                                },
                                dataType: "json",
                                success: function(a) {
                                    ad = hash(hash(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
                                        type: "POST",
                                        url: "/goform/goform_set_cmd_process",
                                        data: {
                                            isTest: "false",
                                            goformId: "APN_PROC_EX",
                                            apn_mode: "manual",
                                            apn_action: "set_default",
                                            set_default_flag: 1,
                                            pdp_type: "IP",
                                            pdp_type_roaming: "IP",
                                            index: 1,
                                            AD: ad
                                        },
                                        error: err
                                    })
                                },
                                error: err
                            })
                        },
                        error: err
                    })
                }
            })
        },
        error: err
    });
}

function ftb()
{
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
                        <td><span id="__lte_signal_1_rsrq"></span> dBm</td>
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
                        <td><span id="__lte_signal_2_rsrq"></span> dBm</td>
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
                        <td><span id="__lte_signal_3_rsrq"></span> dBm</td>
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
                        <td><span id="__lte_signal_4_rsrq"></span> dBm</td>
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
                        <td><span id="__lte_signal_5_rsrq"></span> dBm</td>
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
            <a onclick="setnetmode()">Network Mode</a>
            [
                <a onclick="setnetmode('WL_AND_5G')">Auto</a> |
                <a onclick="setnetmode('Only_5G')">5G SA</a> |
                <a onclick="setnetmode('LTE_AND_5G')">5G NSA</a> |
                <a onclick="setnetmode('4G_AND_5G')">5G SA/NSA/LTE</a> |
                <a onclick="setnetmode('Only_LTE')">LTE</a> |
                <a onclick="setnetmode('Only_WCDMA')">3G</a> |
                <a onclick="setnetmode('Only_GSM')">2G</a>
            ]
            
            <div class="spacing_links"></div>

            <div id="lte_band_selection">
                <a onclick="ltebandselection()">LTE Bands</a>
                [
                    <a onclick="ltebandselection('AUTO')">Auto</a> |
                    <a onclick="ltebandselection('1')">B1</a> |
                    <a onclick="ltebandselection('3')">B3</a> |
                    <a onclick="ltebandselection('7')">B7</a> |
                    <a onclick="ltebandselection('8')">B8</a> |
                    <a onclick="ltebandselection('20')">B20</a> |
                    <a onclick="ltebandselection('1+3')">B1+B3</a> |
                    <a onclick="ltebandselection('1+3')">B1+B3+B7</a>
                ]

                <div class="spacing_links"></div>
            </div>

            <a onclick="nrbandselection()">5G Bands</a>
            [
                <a onclick="nrbandselection('AUTO')">Auto</a> |
                <a onclick="nrbandselection('1')">N1</a> |
                <a onclick="nrbandselection('3')">N3</a> |
                <a onclick="nrbandselection('7')">N7</a> |
                <a onclick="nrbandselection('28')">N28</a> |
                <a onclick="nrbandselection('28,75')">N28+N75</a> |
                <a onclick="nrbandselection('78')">N78</a> |
                <a onclick="nrbandselection('78,28,75')">N78+N28+N75</a>
            ]

            <div class="spacing_links"></div>

            <a onclick="setdns()">IPv4&nbsp;DNS&nbsp;Server</a>&nbsp;<span id="dns_mode"></span>
            [
                <a onclick="setdns('AUTO')">Auto</a> |
                <a onclick="setdns('8.8.8.8,8.8.4.4')">Google</a> |
                <a onclick="setdns('1.1.1.1,1.0.0.1')">CF/APNIC</a> |
                <a onclick="setdns('9.9.9.9,149.112.112.112')">Quad 9</a>
            ]

            <div class="spacing_links"></div>

            <a onclick="makeHiddenSettingsVisible()">Show hidden device settings</a>
            <div class="spacing_links"></div>
            <a onclick="band_info()">Band Info</a> | <a onclick="version_info()">Version Info</a>
            <div class="spacing_links"></div>
            <a onclick="cslock()">Cell Lock</a> <span id="earfcn_lock"></span>
            <div class="spacing_links"></div>
            <a onclick="reboot()">Reboot Router</a>
            <br>
            
        </div>

        <div class="spacing_small"></div>
    </div>

    <div class="spacing"></div>
    `)
}

router_quirks_interval_id = window.setInterval(setRouterQuirks, 250);
setRouterQuirks();

window.setInterval(getStatus, 1000);
getStatus();

window.setInterval(preventAutomaticLogout, 60000);

$("#change").prop("disabled", !1);

$("#umts_signal_container").hide();
for (var i = 1; i <= 3; i++) $("#5g_" + i).hide();
for (var i = 1; i <= 6; i++) $("#lte_" + i).hide();
$("#lte_ca_active_tr").hide();
$("#provider").hide();
$("#cell").hide();
$("#5g_cell").hide();
$("#ngbr_cells").hide();
$("#temperature").hide();
$("#wanipinfo").hide();
