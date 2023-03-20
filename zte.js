/*
 * 
 * Original code by Miononno
 * https://www.youtube.com/watch?v=1kanq1w2DA0
 * 
 * Enhanced by unknown @ lteforum.at
 * 
 */

javascript: ftb();

siginfo =
    "rscp_1,ecio_1,rscp_2,ecio_2,rscp_3,ecio_3,rscp_4,ecio_4," +
    "wan_csq,Z5g_rsrp,Z5g_rsrq,Z5g_SINR," +
    "lte_rsrp_1,lte_rsrp_2,lte_rsrp_3,lte_rsrp_4," +
    "lte_snr_1,lte_snr_2,lte_snr_3,lte_snr_4,5g_rx0_rsrp,5g_rx1_rsrp," +
    "lte_pci,lte_pci_lock,lte_earfcn_lock,wan_ipaddr,wan_apn,pm_sensor_mdm,pm_modem_5g," +
    "nr5g_pci,nr5g_action_channel,nr5g_action_band,wan_active_band,wan_active_channel," +
    "lte_multi_ca_scell_info,cell_id,dns_mode,prefer_dns_manual,standby_dns_manual,network_type," +
    "rmcc,rmnc,lte_rsrq,lte_rssi,lte_rsrp,lte_snr,wan_lte_ca,lte_ca_pcell_band,lte_ca_pcell_bandwidth," +
    "lte_ca_scell_band,lte_ca_scell_bandwidth,wan_ipaddr," +
    "opms_wan_mode,opms_wan_auto_mode,ppp_status,loginfo" +
    ",ngbr_cell_info,signal_detect_quality,hplmn_fullname" +
    ",lte_band,nas_rrc_state,lte_rsrp,lte_rsrq";

function getStatus()
{
    // Prevent automatic logout
    $.ajax({
        type: "GET",
        url: "/tmpl/network/apn_setting.html?v=" + Math.round(+new Date() / 1000)
    })

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

            is_lte = (network_type == "LTE" || network_type == "ENDC" || network_type == "LTE-NSA");
            is_lte_plus = (wan_lte_ca && (wan_lte_ca == "ca_activated" || wan_lte_ca == "ca_deactivated"));
            is_5g = !!nr5g_action_band || !!Z5g_SINR;

            if (is_umts) $("#umts_signal_container").show();
            else $("#umts_signal_container").hide();

            if (is_lte) $("#lte_signal_container").show();
            else  $("#lte_signal_container").hide();

            if (is_lte_plus) $("#lte_ca_active_tr").show();
            else $("#lte_ca_active_tr").hide();

            if (is_5g) $("#5g_signal_container").show();
            else $("#5g_signal_container").hide();
            
            $("#ca_active").html(wan_lte_ca && wan_lte_ca == "ca_activated" ? "&#10003;" : "&#10005;");

            if (lte_multi_ca_scell_info)
            {
                ca_v = lte_multi_ca_scell_info.slice(0, -1).split(";");
                ca_txt = "";
                for (var e = 0; e < ca_v.length; e++)
                {
                    d = ca_v[e].split(",");
                    b = d[3];
                    w = d[5];
                    ca_txt += ' + B' + b + "(" + Math.round(w) + "MHz)";
                }
                lte_ca_pcell_band = "B" + lte_ca_pcell_band;
            }
            else
            {
                ca_txt = "";
                lte_ca_pcell_band = wan_active_band;
            }

            lte_ca_pcell_band = lte_ca_pcell_band && lte_ca_pcell_band.replace("LTE BAND ", "B");

            if (lte_ca_pcell_band)
            {
                $(is_umts ? "#umts_signal_table_main_band" : "#lte_signal_table_main_band").html(" (" + lte_ca_pcell_band + ")");
            }

            if (nr5g_action_band) $("#nr_signal_table_main_band").html(" (" + nr5g_action_band + ")");
            else $("#5g_signal_container").hide();

            if (nr5g_action_band)
            {
                if (_5g_rx0_rsrp == "")
                {
                    _5g_rx0_rsrp = Z5g_rsrp;
                    _5g_rx1_rsrp = "???";
                }
                if (ca_txt != "" || lte_ca_pcell_band) ca_txt += " + ";
                ca_txt += nr5g_action_band;
            }

            lte_multi_ca_scell_info = ca_txt;
            
            if (dns_mode)
            {
                if ("manual" == dns_mode)
                    dns_mode = prefer_dns_manual + "/" + standby_dns_manual;

                dns_mode = dns_mode.replace(/,+$/, "");
                dns_mode = '<span style="color:#b00;">' + dns_mode + "</span>";
            }
        
            lte_ca_pcell_bandwidth = lte_ca_pcell_bandwidth && "(" + Math.round(lte_ca_pcell_bandwidth) + "MHz)";

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
            }

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
            ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD);
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
            ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
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

function ltebandselection(a = null)
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
            n = "0x" + n.toString(16)
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
                ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
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
                        console.log(a)
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
                ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
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
            ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
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
                    ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
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
                                    ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD), $.ajax({
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
            <div id="lte_signal_container">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='4' style='text-align:center'>LTE<span id="lte_signal_table_main_band"></span></td>
                    </tr>
                    <tr>
                        <td>RSRP1:</td>
                        <td><span id="lte_rsrp_1"></span> dBm</td>
                        <td>SINR1:</td>
                        <td><span id="lte_snr_1"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRP2:</td>
                        <td><span id="lte_rsrp_2"></span> dBm</td>
                        <td>SINR2:</td>
                        <td><span id="lte_snr_2"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRP3:</td>
                        <td><span id="lte_rsrp_3"></span> dBm</td>
                        <td>SINR3:</td>
                        <td><span id="lte_snr_3"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRP4:</td>
                        <td><span id="lte_rsrp_4"></span> dBm</td>
                        <td>SINR4:</td>
                        <td><span id="lte_snr_4"></span> dB</td>
                    </tr>
                    <tr>
                        <td>RSRQ:</td>
                        <td><span id="lte_rsrq"></span> dB</td>
                        <td>RSSI:</td>
                        <td><span id="lte_rssi"></span> dBm</td>
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

            

            <div id="5g_signal_container">
                <table class="mod_table signal_table">
                    <tr>
                        <td colspan='2' style='text-align:center'>5G<span id="nr_signal_table_main_band"></span></td>
                    </tr>
                    <tr>
                        <td>RSRP1:</td>
                        <td><span id="_5g_rx0_rsrp"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>RSRP2:</td>
                        <td><span id="_5g_rx1_rsrp"></span> dBm</td>
                    </tr>
                    <tr>
                        <td>SINR:</td>
                        <td><span id="Z5g_SINR"></span> dB</td>
                    </tr>
                </table>

                <div class="spacing"></div>
            </div>


            <div>    
                <table class="mod_table cellinfo_table">
                    <tr>
                        <td>CELL:</td>
                        <td><span id="cell_id"></span></td>
                    </tr>
                    <tr>
                        <td>NGBR:</td>
                        <td><span id="ngbr_cell_info"></span></td>
                    </tr>

                    <tr>
                        <td>CONNECTION:</td>
                        <td><span id="network_type"></span></td>
                    </tr>

                    <tr>
                        <td>BANDS:</td>
                        <td class="bandinfo">
                            <span id="lte_ca_pcell_band"></span><span id="lte_ca_pcell_bandwidth"></span>
                            <span id="lte_multi_ca_scell_info"></span>
                        </td>
                    </tr>
                    <tr id="lte_ca_active_tr">
                        <td>LTE CA ACTIVE:</td>
                        <td><span id="ca_active"></span></td>
                    </tr>
                    <tr>
                        <td>WAN IP:</td>
                        <td><span id="wan_ipaddr"></span></td>
                    </tr>
                    <tr>
                        <td>TEMP:</td>
                        <td>
                            4G: <span id="pm_sensor_mdm"></span>°c&nbsp;&nbsp;
                            5G: <span id="pm_modem_5g"></span>°c
                        </td>
                    </tr>
                </table>
            </div>

        </div>

        <div class="spacing"></div>

        <div class="inner_mod_container mod_border links_container">
            <a onclick="setnetmode()">Network Mode</a>
            [
                <a onclick="setnetmode('Only_5G')">5G SA</a> |
                <a onclick="setnetmode('4G_AND_5G')">5G NSA/LTE</a> |
                <a onclick="setnetmode('Only_LTE')">LTE</a> |
                <a onclick="setnetmode('Only_WCDMA')">3G</a> |
                <a onclick="setnetmode('Only_GSM')">2G</a>
            ]
            
            <div class="spacing_links"></div>

            <a onclick="ltebandselection()">LTE Bands</a>
            [
                <a onclick="ltebandselection('AUTO')">Auto</a> |
                <a onclick="ltebandselection('1')">B1</a> |
                <a onclick="ltebandselection('3')">B3</a> |
                <a onclick="ltebandselection('7')">B7</a> |
                <a onclick="ltebandselection('8')">B8</a> |
                <a onclick="ltebandselection('20')">B20</a>
            ]

            <div class="spacing_links"></div>

            <a onclick="nrbandselection()">5G Bands</a>
            [
                <a onclick="nrbandselection('AUTO')">Auto</a> |
                <a onclick="nrbandselection('1')">N1</a> |
                <a onclick="nrbandselection('3')">N3</a> |
                <a onclick="nrbandselection('7')">N7</a> |
                <a onclick="nrbandselection('28')">N28</a> |
                <a onclick="nrbandselection('78')">N78</a>
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

window.setInterval(getStatus, 1000);
$("#change").prop("disabled", !1);

$("#umts_signal_container").hide();
$("#lte_signal_container").hide();
$("#5g_signal_container").hide();
$("#lte_ca_active_tr").hide();
