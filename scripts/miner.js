$(function() {
    var threads = $('#threads').text();
    var miner;
    var username;
    var status;
    var statsLabels;
    var statsData;
    var doughnutChart;
    var siteKey = "IQHaechLpoNlho4NmXatRn4iPyQEhDmP"; //Change to your address

    function sortMiners(miner, otherMiner) {
        return miner['balance'] > otherMiner['balance'] ? -1 : 1;
    }

    function htmlEncode(value) {
        return $('<div/>').text(value).html();
    }

    function updateStats() {
        $.get("api/getTopMiners.php", function(response) {
            response = $.parseJSON(response);
            var miners = $.map(response, function(balance, username) {
                var json = {};
                json['username'] = username;
                json['balance'] = balance;
                return json;
            });
            miners.sort(sortMiners);
            miners.splice(10);
            $("#toplist").find("tr").remove();
            for (var i = 0; i < miners.length; i++) {
                var username = miners[i]['username'];
                var balance = miners[i]['balance'];
                $('#toplist').append("<tr><td class='rank'>" + escape((i + 1)) + ".</td><td>" + htmlEncode(username) + "</td><td class='num'>" + htmlEncode(balance) + "</td></tr>");
                var index = doughnutChart.data.labels.indexOf(username);
                if (index != -1) {
                    //change existing
                    doughnutChart.data.datasets[0].data[index] = balance;
                } else {
                    //new data
                    doughnutChart.data.datasets[0].data.push(balance);
                    doughnutChart.data.labels.push(username);
                }
                doughnutChart.update();
            }

        });

        $.get("api/getSiteStats.php", function(response) {
            response = $.parseJSON(response);
            $('#pool-hashes').text(response['hashesTotal']);
            $('#pool-hashes-perSecond').text(response['hashesPerSecond'].toFixed(1));
        });
    }

    setInterval(updateStats, 10000);

    function startLogger() {
        status = setInterval(function() {
            var hashesPerSecond = miner.getHashesPerSecond();
            var totalHashes = miner.getTotalHashes();
            var acceptedHashes = miner.getAcceptedHashes();
            $('#hashes-per-second').text(hashesPerSecond.toFixed(1));
            $('#accepted-shares').text(acceptedHashes);
        }, 1000);
    };

    function stopLogger() {
        clearInterval(status);
    };
    $('#thread-add').click(function() {
        threads++;
        $('#threads').text(threads);
        if (miner && miner.isRunning()) {
            miner.setNumThreads(threads);
        }
    });

    $('#thread-remove').click(function() {
        if (threads > 1) {
            threads--;
            $('#threads').text(threads);
            if (miner && miner.isRunning()) {
                miner.setNumThreads(threads);
            }
        }
    });

    $("#start").click(function() {
        if (!miner || !miner.isRunning()) {
            username = $('#username').val();
            if (username) {
                miner = new CoinHive.User(siteKey, username);
                $.get("api/loginUser.php?username=" + username, function() {});
                console.log("setting cookie");
                $.cookie("username", username);
            } else {
                miner = new CoinHive.Anonymous(siteKey);
            }

            $('#username').prop("disabled", true);
            miner.setNumThreads(threads);
            miner.start();
            stopLogger();
            startLogger();
            console.log('miner started');
            $("#start").text("Stop");
        } else {
            miner.stop();
            stopLogger();
            console.log('miner stopped');
            $('#username').prop("disabled", false);
            $("#start").text("Start");
            $('#hashes-per-second').text("0");
        }
    });
    var doughtCanvas = $("#donut-canvas");
    var options = {
        responsive: true,
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Submitted Shares Distribution'
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };
    var dataset = {
        labels: statsLabels,
        datasets: [{
            data: statsData,
            backgroundColor: [
                '#008000', //GREEN
                '#00FFFF', //AQUA
                '#808080', //GRAY
                '#008080', //TEAL
                '#ADD8E6', //LIGHTBLUE
                '#800080', //PURPLE
                '#C0C0C0', //SILVER
                '#800000', //MAROON
                '#FFFF00', //YELLOW
                '#808000' //OLIVE
            ]
        }]
    }
    doughnutChart = new Chart(doughtCanvas, {
        type: 'doughnut',
        data: dataset,
        options: options
    });
    updateStats();
    if($.cookie("username")){
      username = $.cookie("username");
      console.log("cookie found",username);
      $('#username').val(username);
    }

});
