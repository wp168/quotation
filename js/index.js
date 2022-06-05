//获取行情数据

// 创建实例
const ins = axios.create({
  baseURL: "http://112.19.171.231:7080/quotescenter/services",
});

//初始化
let stockdata = [];

//取行情快照的promise的函数
async function stock(marketid, stockcode) {
  const resp = await ins.post("", {
    serviceid: "snapshot",
    body: {
      marketid,
      stockcode: [`${stockcode}`],
    },
  });

  // console.log(resp.data); // resp.data 为响应体的数据，axios会自动解析JSON格式
  // console.log(resp.data.data);
  if (resp.data.status !== 0) {
    alert("后台接口报错");
    return;
  }
  if (resp.data.data.length === 0) {
    alert("股票行情查询失败，请检查股票代码或市场");
    console.log("查询失败，请检查股票代码或市场");
    return;
  } else {
    return resp.data.data; //返回股票行情数据的数组(Array)
  }
}

//初始化默认显示行情
(async function () {
  stockdata = (await stock("0", "000001"))[0];
  html(stockdata, "0");
  const trendDataArr = await getTrendData("0", "000001");
  console.log(trendDataArr);
  picTrend(trendDataArr, "上证指数", 000001);
})();

//form表单事件注册
$(".search").on("submit", async function (e) {
  e.preventDefault();
  const stockcode = $("#code").val(); //搜索框输入的代码
  const marketid = $('.search input[name = "marketid"]:checked').val(); //选择的市场
  stockdata = (await stock(marketid, stockcode))[0]; //得到股票行情信息数组第一项，是一个对象
  const trendDataArr = await getTrendData(marketid, stockcode); //得到行情走势数据，是一个数组
  $("#code").val(""); //搜索框点击查询后清空内容
  html(stockdata, marketid); //更新页面信息
  picTrend(trendDataArr, stockdata.name, stockcode);
});

/**
 * 更新页面上的股票行情信息的函数
 * @param {obj} stockdata 行情数据对象
 * @param {string} marketid 市场id
 */
function html(stockdata, marketid) {
  let mk;
  if (marketid === "0") {
    mk = "SH";
  }
  if (marketid === "1") {
    mk = "SZ";
  }
  //设置title内容
  $(".title").html(
    `<div><h1>${stockdata.name}</h1><span>(${stockdata.code}.${mk})</span></div>
   
     `
  );

  //设置最新价和涨跌幅
  const zd = (stockdata.now - stockdata.close).toFixed(2);
  const zdf = (
    100 *
    ((stockdata.now - stockdata.close) / stockdata.close)
  ).toFixed(2);
  if (stockdata.now > stockdata.close) {
    $(".priceLeft").removeClass("green");
    $(".priceLeft").addClass("red");
    $(".priceLeft").html(`
    <h1>${stockdata.now}<i class="iconfont icon-xiangshang"></i></h1>
    <div class="zdf">
        <span>${zd}</span>
        <span>+${zdf}%</span>
    </div>
    `);
  } else if (stockdata.now < stockdata.close) {
    $(".priceLeft").removeClass("red");
    $(".priceLeft").addClass("green");
    $(".priceLeft").html(`
    <h1>${stockdata.now}<i class="iconfont icon-paixu"></i></h1>
    <div class="zdf">
        <span>${zd}</span>
        <span>${zdf}%</span>
    </div>
    `);
  }

  //设置股价信息
  const cjl = (stockdata.volume / 1000000).toFixed(2);
  const cje = (stockdata.amount / 100000000).toFixed(2);
  if (stockdata.upstop) {
    $(".priceItem").html(`
    <li>今开：${stockdata.open}</li>
    <li>最高：${stockdata.high}</li>
    <li>最低：${stockdata.low}</li>
    <li>昨收：${stockdata.close}</li>
    <li>成交量：${cjl}万手</li>
    <li>成交额：${cje}亿</li>
    <li>涨停价：${stockdata.upstop}</li>
    <li>跌停价：${stockdata.downstop}</li>
    `);
  } else {
    //如果是指数，没有涨停和跌停数据
    $(".priceItem").html(`
    <li>今开：${stockdata.open}</li>
    <li>最高：${stockdata.high}</li>
    <li>最低：${stockdata.low}</li>
    <li>昨收：${stockdata.close}</li>
    <li>成交量：${cjl}万手</li>
    <li>成交额：${cje}亿</li>
    <li>上涨家数：${stockdata.rise}</li>
    <li>下跌家数：${stockdata.down}</li>
       `);
  }

  //设置五档买卖盘口

  let i = 5;
  let sellsHtml;
  let buysHtml;
  if (!stockdata.sells) {
    //如果是指数，没有买卖盘数据
    sellsHtml = "无数据";
    buysHtml = "";
  } else {
    sellsHtml = stockdata.sells
      .map((item) => {
        if (!stockdata.upstop) {
          return "";
        }
        let html = `<span>卖${i}</span><span>${
          item.price
        }</span><span>${Number.parseInt(item.volume / 100)}</span>`;
        i = i - 1;
        return html;
      })
      .join("");

    buysHtml = stockdata.buys
      .map((item) => {
        let html = `<span>买${i + 1}</span><span>${
          item.price
        }</span><span>${Number.parseInt(item.volume / 100)}</span>`;
        i = i + 1;
        return html;
      })
      .join("");
  }

  $(".sells").html(sellsHtml);
  $(".buys").html(buysHtml);
}

//获取分时走势图数据
async function getTrendData(marketid, stockcode) {
  const resp = await ins.post("", {
    serviceid: "trenddata",
    body: {
      marketid,
      stockcode: `${stockcode}`,
      applysize: "-1",
    },
  });

  // console.log(resp.data); // resp.data 为响应体的数据，axios会自动解析JSON格式
  // console.log(resp.data.data);
  if (resp.data.status !== 0) {
    alert(`后台接口报错：${resp.data.message}`);
    return;
  }
  if (resp.data.data.length === 0) {
    alert("股票行情查询失败，请检查股票代码或市场");
    console.log("查询失败，请检查股票代码或市场");
    return;
  } else {
    console.log(resp.data.data);
    return resp.data.data; //返回股票行情数据的数组(Array)
  }
}

// getTrendData("0", 600000);

// 图表1：折线图
// console.log($(".trend")[0]);
function picTrend(trendDataArr, name, stockcode) {
  const myChart = echarts.init($(".trend")[0], null, {
    // width: 1600,
    // height: 800,
  }); // 初始化，获得echart实例
  console.log(trendDataArr.map((it) => `${it.time}`));
  // 给当前图表实例添加配置
  myChart.setOption({
    title: {
      text: `${stockcode} ${name} 分时走势图`, // 图表标题
    },
    tooltip: {}, // 配置了该项，则鼠标移动上去后会有提示
    legend: {
      // 配置图例
      data: ["现价", "均价"],
    },
    xAxis: {
      // 配置横坐标
      data: trendDataArr.map((it) => `${it.time}`),
      min: 1,
      max: 241,
      interval: 1,
    },
    yAxis: {
      name: "价格",
      min: (trendDataArr[0].now * 0.9).toFixed(2),
      max: (trendDataArr[0].now * 1.1).toFixed(2),
    }, // 纵坐标让其自动生成
    series: [
      {
        name: "现价", // 对应到图例
        type: "line", // 类型：线图
        // 配置数据
        data: trendDataArr.map((it) => `${it.now}`),
        smooth: true, // 添加此项可以让曲线变得平滑
      },
      {
        name: "均价", // 对应到图例
        type: "line", // 类型：线图
        // 配置数据
        data: trendDataArr.map((it) => `${it.avgprice}`),
        smooth: true, // 添加此项可以让曲线变得平滑
      },
    ],
  });
}

$(".hot a").click(async function (e) {
  e.preventDefault();
  console.log("click a");
  console.log($(this).text());
  stockdata = (await stock(this.dataset.id, this.dataset.code))[0];
  html(stockdata, this.dataset.id);
  const trendDataArr = await getTrendData(this.dataset.id, this.dataset.code);
  picTrend(trendDataArr, $(this).text(), this.dataset.code);
});
