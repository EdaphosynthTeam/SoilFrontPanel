// 检查依赖是否加载成功
if (!window.dayjs || !window.antd || !window.G2 || !window.ReactDOM || !window.React) {
    alert("依赖加载失败，请检查网络或CDN链接");
}

const r = React;

window.Url = new URL(window.location.href);
Url.port = '8080';
Url = Url.origin

var errorCount = 0; // 错误计数
var chartInstance = null; // 用于存储图表实例
var historyInstance = null; // 用于存储历史数据实例
var dataFetchInterval = null; // 数据获取定时器
var statusCheckInterval = null; // 状态检查定时器
var aiToggle = false;
// const [aiToggle, setAiToggle] = React.useState(true);
// document.cookie = `aiToggle=${aiToggle}`;
var alarmToggle = false;
const AIcookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('aiToggle='));
if (AIcookieValue) {
    aiToggle = AIcookieValue.split('=')[1] === 'true';
} else {
    aiToggle = false;
}

const alarmCookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('alarmToggle='));
if (alarmCookieValue) {
    alarmToggle = alarmCookieValue.split('=')[1] === 'true';
} else {
    alarmToggle = false;
}

function renderChart() {
    // 如果已有图表实例，先销毁
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 初始数据 - 调整顺序为0-5从左到右
    var data = [
        { sec: "0", temp: 25, wp: 50, ph: 7 }, // 初始值
        { sec: "1", temp: 25, wp: 50, ph: 7 },
        { sec: "2", temp: 25, wp: 50, ph: 7 },
        { sec: "3", temp: 25, wp: 50, ph: 7 },
        { sec: "4", temp: 25, wp: 50, ph: 7 },
        { sec: "5", temp: 25, wp: 50, ph: 7 },
    ];

    chartInstance = new G2.Chart({
        container: "mountNode",
        forceFit: true,
        height: window.innerHeight,
        padding: [50, 20, 30, 45] // 上右下左
    });

    chartInstance.source(data);
    chartInstance.scale({
        sec: {
            type: 'cat',  // 明确指定为分类类型
            range: [0, 1]  // 确保数据点均匀分布
        },
        temp: { min: 0, alias: '温度(℃)' },
        wp: { min: 0, max: 100, alias: '湿度(%)' },
        ph: { min: 0, max: 14, alias: 'pH值' }
    });

    // 隐藏所有y轴显示
    chartInstance.axis('temp', false); // 隐藏温度y轴
    chartInstance.axis('wp', false);   // 隐藏湿度y轴
    chartInstance.axis('ph', false);   // 隐藏pH值y轴

    // 添加x轴配置（保持原有x轴显示）
    chartInstance.axis('sec', {
        title: {
            text: '时间点',
            style: {
                fontSize: 12,
                textAlign: 'center'
            }
        },
        label: {
            formatter: val => val + 's'  // 添加单位
        }
    });

    chartInstance.tooltip({
        crosshairs: { type: "line" },
        shared: true
    });

    // 绘制三条折线
    chartInstance.line().position('sec*temp').color('#FF6B6B');
    chartInstance.line().position('sec*wp').color('#4D96FF');
    chartInstance.line().position('sec*ph').color('#6BCB77');

    // 绘制点
    chartInstance.point().position('sec*temp').color('#FF6B6B').size(4).shape('circle');
    chartInstance.point().position('sec*wp').color('#4D96FF').size(4).shape('circle');
    chartInstance.point().position('sec*ph').color('#6BCB77').size(4).shape('circle');

    chartInstance.render();
    const axes = document.querySelectorAll('.g2-axis-x');
    if (axes.length > 1) {
        for (let i = 1; i < axes.length; i++) {
            axes[i].remove();
        }
    }

    // 添加历史数据图表
    const historyData = [
        { date: "5-10", ph: 7, temp: 20, wp: 50 },
        { date: "5-11", ph: 7.2, temp: 21, wp: 52 },
        { date: "5-12", ph: 7.1, temp: 22, wp: 53 },
        { date: "5-13", ph: 7.3, temp: 20.5, wp: 51 },
        { date: "5-14", ph: 7.4, temp: 23, wp: 55 },
        { date: "5-15", ph: 7.2, temp: 22, wp: 54 }
    ];

    // 创建历史图表容器
    const historyContainer = document.getElementById('history');
    if (historyContainer) {
        historyContainer.innerHTML = '<div id="history-chart" style="height:300px"></div>';
        if (historyContainer) {
            // 如果已有历史图表实例，先销毁
            if (historyInstance) {
                historyInstance.destroy();
            }
            
            historyContainer.innerHTML = '<div id="history-chart" style="height:300px"></div>';
            setTimeout(() => {
                const historyChart = new G2.Chart({
                    container: 'history-chart',
                    autoFit: true,
                    height: 300,
                    padding: [30, 30, 60, 60]
                });

                historyChart.source(historyData);
                historyChart.scale({
                    date: { type: 'cat' },
                    temp: { min: 15, max: 30, alias: '温度(℃)' },
                    wp: { min: 40, max: 60, alias: '湿度(%)' },
                    ph: { min: 6, max: 8, alias: 'pH值' }
                });

                // 隐藏所有y轴
                historyChart.axis('temp', false);
                historyChart.axis('wp', false);
                historyChart.axis('ph', false);

                // 绘制面积图
                historyChart.area().position('date*temp').color('#FF6B6B');
                historyChart.area().position('date*wp').color('#4D96FF');
                historyChart.area().position('date*ph').color('#6BCB77');

                // 绘制折线
                historyChart.line().position('date*temp').color('#FF6B6B');
                historyChart.line().position('date*wp').color('#4D96FF');
                historyChart.line().position('date*ph').color('#6BCB77');

                historyChart.render();
            }, 100);
        }
    }

    // 清除之前的定时器
    if (dataFetchInterval) {
        clearInterval(dataFetchInterval);
    }
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    // 每秒获取最新数据
    dataFetchInterval = setInterval(() => {
        fetch(Url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: "getStatus" })
        })
        .then(response => response.json())
        .then(result => {
            // 成功时隐藏错误信息
            const errorContainer = document.getElementById('error-container');
            if (errorContainer) errorContainer.style.display = 'none';

            if (errorCount >= 5) {
                document.getElementById('mountNode').innerHTML = '';
                renderChart(); 
            }
            errorCount = 0; // 重置错误计数

            // 将历史值向后移动
            for (let i = data.length - 1; i > 0; i--) {
                data[i].temp = data[i - 1].temp;
                data[i].wp = data[i - 1].wp;
                data[i].ph = data[i - 1].ph;
            }

            // 设置新的当前值(sec=0)
            data[0].temp = result.temp || 25;
            data[0].wp = result.wp || 50;
            data[0].ph = result.ph || 7;

            // 更新图表
            chartInstance.changeData(data);
        })
        .catch(error => {
            console.error('获取pH数据失败:', error);

            // 显示错误信息
            const errorContainer = document.getElementById('error-container');
            if (errorContainer) {
                errorContainer.style.display = 'flex';
                errorContainer.querySelector('p:nth-of-type(2)').textContent = `错误原因：${error.message}`;
            }

            chartInstance.changeData(0);
            errorCount++; // 增加错误计数
            if (errorCount >= 5) {
                const chartContainer = document.getElementById('chart-container');
                chartContainer.style.display = 'flex';
                chartContainer.style.alignItems = 'center';
                chartContainer.style.justifyContent = 'center';

                chartContainer.style.textAlign = 'center';
                function retryButton(){
                    return r.createElement('div', null, 
                        r.createElement('h3', { style : { fontWeight : 'bold' } }, '获取pH数据失败'),
                        r.createElement('p', null, '请检查网络连接或设备是否正常运行。'),
                        r.createElement('p', { style : {color: 'red'} }, '错误原因：' + error.message),
                        r.createElement(antd.Button, { onClick: () => {
                            errorCount = 0; // 重置错误计数

                            // 只清除图表部分，保留错误信息
                            const chartNode = document.getElementById('mountNode');
                            if (chartNode) {
                                chartNode.innerHTML = '';

                                // 重新创建图表容器
                                const newContainer = document.createElement('div');
                                newContainer.id = 'mountNode';
                                chartNode.appendChild(newContainer);

                                // 重新渲染图表
                                setTimeout(() => {
                                    renderChart();
                                }, 100);
                            }
                        } }, '重试'),
                        r.createElement('div', null, 
                            "或者，您还可以尝试",
                            r.createElement('a', { onClick : () => location.reload(), id : 'err-reload' }, "刷新页面")
                        )
                    );
                }
                const retryElement = retryButton();
                if (errorCount === 5) {
                    document.getElementById('mountNode').innerHTML = ''; // 清空内容
                }
                ReactDOM.render(retryElement, document.getElementById('mountNode')); // 使用ReactDOM.render替代appendChild
            }
        });
    }, 1000);

    // 添加连接状态检查
    statusCheckInterval = setInterval(() => {
        fetch(Url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: "check" })
        })
        .then(response => response.json())
        .then(result => {
            const statusElement = document.getElementById('connection-status');
            if (result.status === "ok" && result.code === 200 && statusElement) {
                statusElement.textContent = "已连接";
                statusElement.style.color = "green";
            } else if (statusElement) {
                statusElement.textContent = "连接失败";
                statusElement.style.color = "red";
            }
        })
        .catch(() => {
            const statusElement = document.getElementById('connection-status');
            if (statusElement) {
                statusElement.textContent = "未连接";
                statusElement.style.color = "red";
            }
        });
    }, 2000);
}

function settingTab() {
    const [aiBtnDisabled, setAiBtnDisabled] = React.useState(!aiToggle);
    const [alarmBtnDisabled, setAlarmBtnDisabled] = React.useState(!alarmToggle);

    return r.createElement(
        React.Fragment,
        null,
        r.createElement('div', {
            style: {
                transform: 'translateX(50px)'
            }
        }, 
            r.createElement('h3', { style : { fontWeight : 'bold' } }, '设置'),
            r.createElement('p', null, '在这里，您可以设置各种参数，以满足您的需求。'),
            r.createElement('div', null, 
                r.createElement('h4', { style : { fontWeight : 'bold' } }, '功能设置'),
                r.createElement('div', null, 
                    r.createElement(antd.Card, {
                        style: {
                            display: 'flex',
                            width: '95%',
                            alignItems: 'center', // 垂直居中
                        }
                    }, 
                        r.createElement('div', {
                            style: {
                                display: 'flex',
                                alignItems: 'center', // 垂直居中
                                justifyContent: 'flex-start',
                                height: '50px'
                            }
                        }, 
                            r.createElement('div', {
                                id: "ai-toggle",
                                style: {
                                    display: 'flex',
                                    alignItems: 'center', // 垂直居中
                                    gap: '900px',
                                    // 子元素左右排列
                                    flexDirection: 'row',
                                    justifyContent: 'space-between', // 修改为左右排列
                                }
                            }, 
                                
                                r.createElement('div', {
                                    style: {
                                        width: '200px'
                                    }
                                }, 
                                    r.createElement('p', { style : { marginBlock : '5px' } }, 'AI总结（实验性）'),
                                    r.createElement('p', { style : { fontSize : '12px', color : 'gray', marginBlock : '5px' } }, '对土壤酸碱度的智能评测')
                                ),
                                r.createElement('div', {
                                    style: {
                                        // 左右排列
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'flex-start',
                                    }
                                }, r.createElement(antd.Switch, {
                                    id: "ai-toggle",
                                    defaultChecked: aiToggle,
                                    onChange: (checked) => {
                                        aiToggle = checked;
                                        document.cookie = `aiToggle=${aiToggle}; path=/; max-age=2592000`;
                                    }
                                }), r.createElement(antd.Button, {
                                    icon: r.createElement('div', {
                                        style: {
                                            // 水平、垂直居中
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            transform: 'translateY(-4px)'
                                        },
                                        // 设置为禁用
                                        disabled: aiBtnDisabled
                                    }, 
                                    r.createElement('p', null, '...')
                                ),
                                    style: {
                                        marginLeft: '10px'
                                    }
                                }))
                                
                            )
                        )
                    )
                ),
                r.createElement('div', null, 
                    r.createElement(antd.Card, {
                        style: {
                            display: 'flex',
                            width: '95%',
                            alignItems: 'center', // 垂直居中
                        }
                    }, 
                        r.createElement('div', {
                            style: {
                                display: 'flex',
                                alignItems: 'center', // 垂直居中
                                justifyContent: 'flex-start',
                                height: '50px'
                            }
                        }, 
                            r.createElement('div', {
                                id: "ai-toggle",
                                style: {
                                    display: 'flex',
                                    alignItems: 'center', // 垂直居中
                                    gap: '900px',
                                    // 子元素左右排列
                                    flexDirection: 'row',
                                    justifyContent: 'space-between', // 修改为左右排列
                                }
                            }, 
                                
                                r.createElement('div', {
                                    style: {
                                        width: '200px'
                                    }
                                }, 
                                    r.createElement('p', { style : { marginBlock : '5px' } }, '报警功能（刷新后生效）'),
                                    r.createElement('p', { style : { fontSize : '12px', color : 'gray', marginBlock : '5px' } }, '当土壤酸碱度超过设定值时，会发出报警')
                                ),
                                r.createElement('div', {
                                    style: {
                                        // 左右排列
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'flex-start',
                                    }
                                }, r.createElement(antd.Switch, {
                                    id: "alarm-toggle",
                                    defaultChecked: alarmToggle,
                                    onChange: (checked) => {
                                        alarmToggle = checked;
                                        document.cookie = `alarmToggle=${alarmToggle}; path=/; max-age=2592000`;
                                    }
                                }), r.createElement(antd.Button, {
                                    icon: r.createElement('div', {
                                        style: {
                                            // 水平、垂直居中
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            transform: 'translateY(-4px)'
                                        },
                                        // 设置为禁用
                                        disabled: alarmBtnDisabled
                                    }, 
                                    r.createElement('p', null, '...')
                                ),
                                    style: {
                                        marginLeft: '10px'
                                    }
                                }))
                                
                            )
                        )
                    )
                )
            )
        )
    )
}

function themeTab() {
    // 读取cookie中的主题设置
    const theme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1] || "light"; // 默认主题为light 

    return r.createElement(
        
    )
}

function debugTab() {
    // 读取cookie中的历史记录（包括自动输出）
    const historyOutput =
        document.cookie
            .split("; ")
            .find((row) => row.startsWith("commandHistory="))
            ?.split("=")[1] || "";

    return r.createElement(
        React.Fragment,
        null,
        r.createElement(
            "div",
            {
                style: {
                    backgroundColor: "#8ca9de",
                    marginBottom: "0",
                    transform: "translateX(50px)",
                },
                className: "content-item"
            },
            r.createElement("h3", { style: { fontWeight: "bold" } }, "调试"),
            r.createElement(
                "p",
                null,
                "这里是调试菜单，您可以查看日志、输出，还能利用远程命令行实现一些功能，请注意，这些功能仅供开发者和维修人员进行功能测试，随意使用可能导致设备损坏。"
            ),
            r.createElement(
                "div",
                {},
                r.createElement(
                    "div",
                    { style: { width: "25%" } },
                    r.createElement(
                        antd.Card,
                        {
                            style: { width: "1050px" },
                        },
                        r.createElement(
                            "h4",
                            { style: { fontWeight: "bold" } },
                            "实时输出"
                        ),
                        r.createElement(
                            "div",
                            { id: "log", style: { width: "1000px" } },
                            r.createElement(
                                "div",
                                {
                                    id: "log-content",
                                    style: {
                                        height: "500px",
                                        width: "1000px",
                                        overflow: "auto",
                                        backgroundColor: "#f5f5f5",
                                        padding: "10px",
                                        fontFamily: "monospace",
                                        whiteSpace: "pre",
                                    },
                                },
                                // 添加历史记录标记
                                historyOutput &&
                                r.createElement(
                                    "span",
                                    {
                                        style: { color: "yellow" },
                                    },
                                    "[== 历史输出 ==]\n" +
                                    decodeURIComponent(historyOutput) +
                                    "\n[== 结束 ==]\n"
                                )
                            )
                        ),
                        r.createElement(antd.Input, {
                            placeholder: "输入命令",
                            onPressEnter: (e) => {
                                const input = e.target;
                                if (input.value) {
                                    const logContent = document.getElementById("log-content");
                                    if (logContent) {
                                        // 获取现有历史记录
                                        const existingHistory =
                                            document.cookie
                                                .split("; ")
                                                .find((row) => row.startsWith("commandHistory="))
                                                ?.split("=")[1]
                                                ?.replace(/%25A/g, "\n") || "";
                                        const decodedHistory = existingHistory
                                            ? decodeURIComponent(existingHistory)
                                            : "";

                                        if (input.value) {
                                            // 保存新命令到cookie（追加到历史记录）
                                            document.cookie = `commandHistory=${encodeURIComponent(
                                                decodedHistory + input.value + "\n"
                                            )}; max-age=2592000`;

                                            logContent.textContent += `${input.value}\n`;
                                            logContent.scrollTop = logContent.scrollHeight;
                                        }
                                    }
                                    input.value = "";
                                }
                            },
                            style: { width: "100%" },
                            suffix: r.createElement(antd.Button, {
                                type: "text",
                                icon: r.createElement(
                                    "svg",
                                    {
                                        width: "16",
                                        height: "16",
                                        viewBox: "0 0 24 24",
                                    },
                                    r.createElement("path", {
                                        d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
                                        fill: "currentColor",
                                    })
                                ),
                                onClick: (e) => {
                                    e.stopPropagation();
                                    const input = document.querySelector(".ant-input");
                                    if (input && input.value) {
                                        const logContent = document.getElementById("log-content");
                                        if (logContent) {
                                            // 获取现有历史记录
                                            const existingHistory =
                                                document.cookie
                                                    .split("; ")
                                                    .find((row) => row.startsWith("commandHistory="))
                                                    ?.split("=")[1] || "";
                                            const decodedHistory = existingHistory
                                                ? decodeURIComponent(existingHistory)
                                                : "";

                                            // 保存新命令到cookie（追加到历史记录）
                                            document.cookie = `commandHistory=${encodeURIComponent(
                                                decodedHistory + input.value + "\n"
                                            )}; max-age=2592000`;

                                            logContent.textContent += `${input.value}\n`;
                                            logContent.scrollTop = logContent.scrollHeight;
                                        }
                                        input.value = "";
                                    }
                                },
                            }),
                        })
                    )
                ),
                r.createElement(
                    "div",
                    {
                        style: {
                            marginBlock: "10px",
                            width: "500px",
                        },
                    },
                    r.createElement(
                        antd.Card,
                        {
                            style: {
                                // 左右排列
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                            },
                        },
                        r.createElement(
                            "h4",
                            { style: { fontWeight: "bold" } },
                            "日志管理"
                        ),
                        r.createElement(
                            "div",
                            {
                                style: {
                                    width: "50%",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                },
                            },
                            r.createElement(
                                antd.Button,
                                {
                                    type: "primary",
                                    onClick: () => {
                                        alert("下载日志包功能尚未实现");
                                    },
                                },
                                "下载日志包"
                            ),
                            r.createElement(
                                antd.Button,
                                {
                                    type: "primary",
                                    style: { marginLeft: "10px", backgroundColor: "red" },
                                    onClick: () => {
                                        alert("清空日志功能尚未实现");
                                    },
                                },
                                "清空日志"
                            )
                        )
                    )
                )
            )
        )
    );
}

function dashboard() {
    const [errorInfo, setErrorInfo] = React.useState({
        show: false,
        message: "",
        details: ""
    });

    const mainStyle = {
        style: {
            backgroundColor: "#8ca9de",
            marginBottom: "0",
        },
    };

    

    return r.createElement(
        React.Fragment,
        null,
        r.createElement(
            "div",
            {
                style: {
                    transform: "translateX(50px)",
                },
            },
            r.createElement(
                React.Fragment,
                null,
                r.createElement(
                    "div",
                    {
                        style: mainStyle.style,
                        id: "main"
                    },
                    r.createElement(
                        "div",
                        {
                            style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }
                        },
                        r.createElement(
                            "h3",
                            {
                                style: {
                                    fontWeight: "bold",
                                },
                                className: "content-item",
                                id: "dashboard-title",
                            },
                            "仪表盘"
                        ),
                        r.createElement(
                            "span",
                            {
                                id: "connection-status",
                                style: {
                                    color: "red",
                                    fontSize: "14px"
                                }
                            },
                            "未连接"
                        )
                    ),
                    r.createElement("p", null, "欢迎使用后台管理系统"),
                    r.createElement('div', {
                        style: {
                            // 子元素左右排列
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            gap: "20px"
                        }
                    }, 
                        r.createElement(
                            "div",
                            {
                                style: {
                                    width: "50%",
                                    height: "auto",
                                    marginBlock: "30px"
                                },
                                className: "dashboard-card",
                            },
                            r.createElement(
                                antd.Card,
                                null,
                                r.createElement(
                                    "h4",
                                    {
                                        style: { fontWeight: "bold" },
                                    },
                                    "实时数据"
                                ),
                                r.createElement(
                                    "div",
                                    {
                                        style: { height: "725px" , width: "calc(100% - 25px)"},
                                        id: "chart-container"
                                    },
                                    r.createElement(
                                        "div",
                                        {
                                            id: "mountNode",
                                            style: { width: "calc(100% - 25px)" }
                                        },
                                        null
                                    )
                                )
                                
                            )
                            ),
                            alarmToggle && r.createElement('div', {
                                style: {
                                    transform: 'translateY(30px)'
                                },
                            }, 
                                r.createElement(antd.Card, {
                                    className: "dashboard-card"
                                }, 
                                    r.createElement('div', {}, 
                                        r.createElement('h4', { style: { fontWeight: "bold" } }, "警报系统"),
                                        r.createElement('div', {}, 
                                            r.createElement('p', { id : "alarm-status" , style : { display: "none" } }, "状态获取失败"),
                                            r.createElement('div', { className : "alarm-icon" ,  id: "alarm-warn-div", style : { display: "block" } }, 
                                                r.createElement('svg', {
                                                    width: "100",
                                                    height: "100",
                                                    viewBox: "0 0 100 100",
                                                    style: {
                                                        display: "none"
                                                    },
                                                    id: "alarm-warn-icon"
                                                },
                                                
                                                r.createElement('polygon', {
                                                    points: "50,5 95,95 5,95",
                                                    fill: 'yellow',
                                                    stroke: 'black',
                                                    strokeWidth: '2'
                                                }),
                                                r.createElement('text', {
                                                    x: '50',
                                                    y: '75',
                                                    fontSize: '50',
                                                    textAnchor: 'middle',
                                                    fill: 'black'
                                                }, '!')
                                            
                                            )),
                                            r.createElement('div', { className : "alarm-content" , id: "alarm-ok-div", style : { display: "block" } }, 
                                                r.createElement('svg', {
                                                    width: "100",
                                                    height: "100",
                                                    viewBox: "0 0 100 100",
                                                    id: "alarm-ok-icon",
                                                    style: {
                                                        display: "none"
                                                    }
                                                },
                                                r.createElement('circle', {
                                                    cx: "50",
                                                    cy: "50",
                                                    r: "45",
                                                    fill: "none",
                                                    stroke: "#ddd",
                                                    strokeWidth: "2"
                                                }),
                                                r.createElement('circle', {
                                                    id: "circle",
                                                    cx: "50",
                                                    cy: "50",
                                                    r: "45",
                                                    fill: "none",
                                                    stroke: "#4CAF50",
                                                    strokeWidth: "4",
                                                    strokeDasharray: "283",
                                                    strokeDashoffset: "283"
                                                },
                                                r.createElement('animate', {
                                                    attributeName: "stroke-dashoffset",
                                                    from: "283",
                                                    to: "0",
                                                    dur: "1s",
                                                    fill: "freeze"
                                                })
                                                ),
                                                r.createElement('path', {
                                                    id: "check",
                                                    d: "M20 50 L40 70 L80 30",
                                                    stroke: "#4CAF50",
                                                    strokeWidth: "8",
                                                    strokeLinecap: "round",
                                                    fill: "none",
                                                    strokeDasharray: "100",
                                                    strokeDashoffset: "100"
                                                },
                                                r.createElement('animate', {
                                                    attributeName: "stroke-dashoffset",
                                                    from: "100",
                                                    to: "0",
                                                    dur: "0.5s",
                                                    begin: "1s",
                                                    fill: "freeze"
                                                })
                                                )
                                                )
                                            ),
                                            r.createElement('svg', {
                                                width: "50",
                                                height: "50",
                                                viewBox: "0 0 50 50",
                                                id: "alarm-loading",
                                                style: { display : "block" }
                                            },
                                                r.createElement('circle', {
                                                    cx: "25",
                                                    cy: "25",
                                                    r: "20",
                                                    fill: "none",
                                                    stroke: "#ddd",
                                                    strokeWidth: "4"
                                                }),
                                                r.createElement('circle', {
                                                    cx: "25",
                                                    cy: "25",
                                                    r: "20",
                                                    fill: "none",
                                                    stroke: "#4285F4",
                                                    strokeWidth: "4",
                                                    strokeLinecap: "round",
                                                    strokeDasharray: "30, 100"
                                                },
                                                r.createElement('animateTransform', {
                                                    attributeName: "transform",
                                                    type: "rotate",
                                                    from: "0 25 25",
                                                    to: "360 25 25",
                                                    dur: "1.5s",
                                                    repeatCount: "indefinite"
                                                })
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        ),
                    // r.createElement(
                    //     'h3',
                    //     {
                    //         style: {
                    //             fontWeight: "bold",
                    //         }
                    //     },
                    //     "历史数据统计"
                    // ),
                    r.createElement(
                        "div",
                        {
                            style: {
                                /* 左右排列 */
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                gap: "20px",
                            },
                        },
                        r.createElement(
                            "div",
                            {
                                style: {
                                    width: "25%",
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                                    height: "120px",
                                    marginBlock: "20px",
                                },
                                className: "dashboard-card",
                                id: "time-card",
                            },
                            r.createElement(
                                antd.Card,
                                null,
                                r.createElement(
                                    "div",
                                    {
                                        style: {
                                            height: "100%",
                                            display: "flex", // 使用flex布局
                                            alignItems: "center", // 垂直居中
                                            justifyContent: "center", // 水平居中
                                        },
                                    },
                                    r.createElement(antd.DatePicker, {
                                        id: "date-picker-data",
                                        style: { width: "100%" },
                                        placeholder: "请选择日期查看某一天的数据",
                                        onChange: (date, dateString) => {
                                            console.log(date, dateString);
                                            const label = document.getElementById(
                                                "date-available-label"
                                            );
                                            if (!date) {
                                                // 当日期被清空时
                                                label.style.display = "none";
                                                return;
                                            }

                                            if (label) {
                                                label.style.display = "block";

                                                const today = dayjs();
                                                if (date.isAfter(today)) {
                                                    label.textContent = "无效日期";
                                                    label.style.color = "red";
                                                } else {
                                                    label.textContent = "日期可用";
                                                    label.style.color = "green";
                                                }
                                            }
                                        },
                                    })
                                )
                            ),
                            r.createElement(
                                "label",
                                {
                                    style: {
                                        marginLeft: "25px",
                                        fontSize: "13px",
                                        color: "green",
                                        display: "none", // 初始隐藏
                                    },
                                    id: "date-available-label",
                                },
                                "日期可用"
                            )
                        ), r.createElement(
                           "div",
                           {    style: {
                                    transform: "translateY(20px)"
                                },
                                
                           },
                           r.createElement(
                              antd.Card,
                              {
                                className: "dashboard-card"
                              },
                              aiToggle ? r.createElement(
                                 "div",
                                 null,
                                 r.createElement(
                                    "h3",
                                    {
                                       style: { fontWeight: "bold" },
                                    },
                                    "AI总结" 
                                 ),
                                r.createElement(
                                    "p",
                                    {
                                        id: "ai-summary"
                                    },
                                    "加载中...(っ•̀ω•́)っ"
                                )
                              ) : r.createElement('div', null, 
                                r.createElement('p', null, 'AI总结功能未开启')
                              )
                           ) 
                        )
                    ),
                    r.createElement('div', {
                        id: "history-data-container",
                        style: {
                            display: "block"
                        }
                    },
                    r.createElement('div', {
                        id: "history-data-table",
                        style: {
                            display: "block"
                        }
                    }, 
                        r.createElement('div', null, 
                            r.createElement(antd.Card, {
                                style: {
                                    width: "50%"
                                }
                            }, 
                                r.createElement('div', null, 
                                    r.createElement('h3', null, "历史数据统计"),
                                    r.createElement('div', null, 
                                        r.createElement('div', {
                                            id: "history"
                                        }, 
                                            r.createElement('div', {
                                                id: "history-chart",
                                                style: {
                                                    height: "300px"
                                                }
                                            }, null)
                                        )
                                    )
                                )
                            )
                        )
                    )
                    )
                )
            )
        )
    );
}
// 在文件顶部添加全局模态框状态和函数

// 在renderUI函数中添加模态框组件
function renderUI(menuItem) {
    const topBarItemStyle = {
        style: {
            marginLeft: "20px",
        },
    };

    // 添加当前选中的菜单项状态
    const [selectedKey, setSelectedKey] = React.useState("1");

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalTitle, setModalTitle] = React.useState("");
    const [modalContent, setModalContent] = React.useState(null);

    // 添加全局函数
    window.setModal = (visible, title = "", content = null) => {
        setModalVisible(visible);
        if (title) setModalTitle(title);
        if (content) setModalContent(content);
    };

    // 在组件挂载时设置正确的选中状态
    React.useEffect(() => {
        setSelectedKey(
            menuItem === dashboard ? "1" : menuItem === debugTab ? "2" : "3"
        );
    }, [menuItem]);
    return r.createElement(
        React.Fragment,
        null,
        // 在renderUI函数中修改Modal部分
        r.createElement(window.AntdDraggableModal || antd.Modal, {
            title: modalTitle,
            visible: modalVisible,
            onCancel: () => setModalVisible(false),
            footer: [
                r.createElement(antd.Button, {
                    key: "close",
                    onClick: () => setModalVisible(false)
                }, "关闭")
            ],
            mask: true,
            destroyOnClose: true,
            wrapClassName: 'draggable-modal' // 必须添加这个className
        }, modalContent),
        // 独立的上边栏
        r.createElement(
            "div",
            {
                style: {
                    backgroundColor: "rgb(0, 145, 255)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    padding: "0 16px",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                },
                id: "top-bar"
            },
            r.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        color: "black",
                        fontSize: "16px",
                        fontWeight: "bold",
                    },
                },
                r.createElement(
                    "a",
                    {
                        style: {
                            marginLeft: topBarItemStyle["style"]["marginLeft"],
                            // transform: 'translateX(-50px)',
                        },
                        href: "#",
                    } /*, r.createElement('svg', { width: '24', height: '24', viewBox: '0 0 24 24', style: { display: 'flex', alignItems: 'center' } },
                    r.createElement('rect', { x: '10', y: '4', width: '30', height: '2', fill: 'black' }),
                    r.createElement('rect', { x: '10', y: '10', width: '30', height: '2', fill: 'black' }),
                    r.createElement('rect', { x: '10', y: '16', width: '30', height: '2', fill: 'black' })
                )*/
                ,
                r.createElement("label", {
                    style: {
                       marginLeft: topBarItemStyle["style"]["marginLeft"],
                       color: "white", 
                    }
                }, "后台管理系统"))
            )
        ),

        // 主体内容区域（侧边栏+内容）
        r.createElement(
            "div",
            { style: { display: "flex", height: "calc(100vh - 64px)" } },
            // 左侧边栏
            r.createElement(
                "div",
                {
                    style: {
                        width: "200px",
                        background: "rgb(103, 142, 220)",
                        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
                    },
                    id: "sidebar"
                },
                r.createElement(
                    "div",
                    { style: { padding: "16px" } , id: "sidebar-title" },
                    r.createElement("h3", { style: { color: "white" } }, "菜单")
                ),
                r.createElement(antd.Menu, {
                    style: {
                        backgroundColor: "rgb(103, 142, 220)",
                        color: "white",
                        fontSize: "16px",
                    },
                    mode: "inline",
                    selectedKeys: [selectedKey],
                    items: [
                        {
                            key: "1",
                            label: r.createElement(
                                "span",
                                null,
                                r.createElement(
                                    "svg",
                                    {
                                        width: "16",
                                        height: "16",
                                        viewBox: "0 0 24 24",
                                        style: { marginRight: "8px" },
                                    },
                                    r.createElement("path", {
                                        d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.24-12.24l-1.41 1.41-2.83-2.83 1.41-1.41c.78-.78 2.05-.78 2.83 0 .78.78.78 2.05 0 2.83z",
                                        fill: "currentColor",
                                    })
                                ),
                                "仪表盘"
                            ),
                        },
                        {
                            key: "2",
                            label: r.createElement(
                                "span",
                                null,
                                // r.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", style: { marginRight: '8px' } },
                                //     r.createElement('path', { d: "M12 2C10.34 2 9 3.34 9 5c0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.66-1.34-3-3-3zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", fill: "currentColor" })
                                // ),
                                "🔧调试"
                            ),
                        },
                        { key: "3", label: "系统设置" }
                    ],
                    id: "sidebar-menu",
                    onClick: (info) => {
                        const key = info.key;
                        // 先销毁所有图表实例
                        if (chartInstance) {
                            chartInstance.destroy();
                            chartInstance = null;
                        }
                        if (historyInstance) {
                            historyInstance.destroy();
                            historyInstance = null;
                        }
                        if (key === "1") {
                            main(dashboard);
                            // 确保图表容器存在并立即渲染
                            setTimeout(() => {
                                if (!document.getElementById('mountNode')) {
                                    const chartContainer = document.getElementById('chart-container');
                                    const mountNode = document.createElement('div');
                                    mountNode.id = 'mountNode';
                                    chartContainer.appendChild(mountNode);
                                }
                                renderChart();
                            }, 100);
                        } else if (key === "2") {
                            main(debugTab);
                        } else if (key === "3") {
                            main(settingTab);
                        }
                    }
                })
            ),

            // 右侧内容区域
            r.createElement(
                "div",
                {
                    style: {
                        flex: 1,
                        backgroundColor: "#8ca9de",
                        padding: "16px",
                        overflow: "auto",
                    },
                    id: "content"
                },
                menuItem()
            )
        )
    );
}

function main(menuItem = dashboard) {
    try {
        
        ReactDOM.render(
            r.createElement(
                React.StrictMode,
                null,
                r.createElement(() => renderUI(menuItem), null)
            ),
            document.getElementById("app")
        );

        

        // 只在dashboard时初始化图表容器
        if (menuItem === dashboard) {
            const chartContainer = document.getElementById('chart-container');
            if (chartContainer && !document.getElementById('mountNode')) {
                const mountNode = r.createElement('div', { id: 'mountNode' });
                ReactDOM.render(mountNode, chartContainer);
            }
            // 立即渲染图表
            setTimeout(() => {
                if (chartInstance) {
                    chartInstance.destroy();
                    chartInstance = null;
                }
                if (historyInstance) {
                    historyInstance.destroy();
                    historyInstance = null;
                }
                renderChart();
                const aiSummary = document.getElementById("ai-summary");
                if(aiSummary) {
                    aiSummary.textContent = window.aiMsg;
                }
                const alarmWarnDiv = document.getElementById("alarm-warn-div");
                const alarmOkDiv = document.getElementById("alarm-ok-div");
                const alarmStatus = document.getElementById("alarm-status");
                const alarmLoading = document.getElementById("alarm-loading");
                
                // 确保元素存在再操作
                if (alarmWarnDiv && alarmOkDiv && alarmStatus && alarmLoading) {
                    alarmLoading.style.display = "none";
                    alarmStatus.style.display = "block";
                    if (window.alarmStatus === 1) {
                        alarmWarnDiv.style.display = "block";
                        const warnIcon = document.getElementById("alarm-warn-icon");
                        if (warnIcon) warnIcon.style.display = "block";
                        
                        alarmOkDiv.style.display = "none";
                        const okIcon = document.getElementById("alarm-ok-icon");
                        if (okIcon) okIcon.style.display = "none";
                        
                        alarmStatus.textContent = "状态异常";
                        
                        // 安全地设置样式
                        const elementsToStyle = [
                            "top-bar", "sidebar", "content", 
                            "app", "sidebar-menu", "main",
                            "sidebar-title"
                        ];
                        
                        elementsToStyle.forEach(id => {
                            const el = document.getElementById(id);
                            if (el) {
                                if (id === "top-bar") {
                                    el.style.backgroundColor = "red";
                                } else if (id === "sidebar" || id === "sidebar-menu") {
                                    el.style.backgroundColor = "rgb(232, 192, 192)";
                                    if (id === "sidebar-menu") {
                                        el.style.color = "rgb(110, 110, 110)";
                                    }
                                } else if (id === "content" || id === "app" || id === "main") {
                                    el.style.backgroundColor = "rgb(248, 155, 155)";
                                } else if (id === "sidebar-title") {
                                    el.style.color = "rgb(110, 110, 110)";
                                }
                            }
                        });
                        
                        
                    } else if (window.alarmStatus === 0) {
                        const okIcon = document.getElementById("alarm-ok-icon");
                        if (okIcon) okIcon.style.display = "block";
                        alarmOkDiv.style.display = "block";
                        
                        const warnIcon = document.getElementById("alarm-warn-icon");
                        if (warnIcon) warnIcon.style.display = "none";
                        alarmWarnDiv.style.display = "none";
                        
                        alarmStatus.textContent = "状态正常";
                    } else {
                        alarmOkDiv.style.display = "none";
                        alarmWarnDiv.style.display = "none";
                        alarmStatus.textContent = "状态获取失败";
                    }
                }
            }, 100);
        }

        // 将自动输出逻辑移到渲染完成后
        const intervalId = setInterval(() => {
            const logContent = document.getElementById("log-content");
            if (logContent) {
                const output = "a\n";
                logContent.textContent += output;
                logContent.scrollTop = logContent.scrollHeight;

                // 保存自动输出到cookie
                const existingHistory =
                    document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("commandHistory="))
                        ?.split("=")[1] || "";
                const decodedHistory = existingHistory
                    ? decodeURIComponent(existingHistory)
                    : "";
                document.cookie = `commandHistory=${encodeURIComponent(
                    decodedHistory + input.value
                )}; max-age=2592000`;

                // 修改读取历史记录的部分
                const historyOutput =
                    document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("commandHistory="))
                        ?.split("=")[1] || "";

                // 修改显示历史记录的部分
                historyOutput &&
                    r.createElement(
                        "span",
                        {
                            style: { color: "yellow" },
                        },
                        "[== 历史输出 ==]\n" + decodedHistory + "\n[== 结束 ==]\n"
                    ),
                    r.createElement("span", null, null);
            };
            
        }, 2000);
        // setTimeout(() => {
            
        // }, 100);
        // 清理定时器
        return () => clearInterval(intervalId);
        
    } catch (error) {
        console.error("渲染出错:", error);
    }
}

// 将变量挂载到window对象实现全局访问
window.aiMsg = "Loading...(っ•̀ω•́)っ";

// 修改fetch请求
aiToggle && fetch(Url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ type: "getAIResult", time: 1/6 })
})
.then(response => response.json())
.then(data => {
    
    if(data.status === "ok") {
        window.aiMsg = data.message; // 更新全局变量
    } else {
        window.aiMsg = "获取AI信息失败"; // 更新全局变量
    }

    // 确保在这里更新aiSummary的内容
    const aiSummary = document.getElementById("ai-summary");
    if (aiSummary) {
        aiSummary.textContent = window.aiMsg; // 使用全局变量
    } else {
        console.error("未找到ai-summary元素");
    }
})
.catch(error => {
    
    window.aiMsg = "请求失败"; // 更新全局变量
    console.error("请求失败:", error);
    const aiSummary = document.getElementById("ai-summary");
    if (aiSummary) {
        aiSummary.textContent = window.aiMsg; // 使用全局变量
    } else {
        console.error("未找到ai-summary元素");
    }
});



main();


window.onload = () => {
    fetch(Url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ type: "getAlarmStatus" })
    })
    .then(response => response.json())
    .then(data => {
        
        if(data.status === "ok") {
            window.alarmStatus = data.value; // 更新全局变量
        } else {
            window.alarmStatus = -1; // 更新全局变量
        }

        // 确保在这里更新aiSummary的内容
        const alarmStatus = document.getElementById("alarm-status");
        const alarmWarnDiv = document.getElementById("alarm-warn-div");
        const alarmOkDiv = document.getElementById("alarm-ok-div");
        const alarmLoading = document.getElementById("alarm-loading");
        
        // 检查元素是否存在
        if (!alarmStatus || !alarmWarnDiv || !alarmOkDiv || !alarmLoading) {
            console.error("未找到元素，请检查HTML结构");
            return;
        }

        // 更新UI
        alarmLoading.style.display = "none";
        alarmStatus.style.display = "block";
        
        if (window.alarmStatus === 1) {
            alarmWarnDiv.style.display = "block";
            // 添加这行代码来显示警告图标
            document.getElementById("alarm-warn-icon").style.display = "block";
            alarmOkDiv.style.display = "none";
            document.getElementById("alarm-ok-icon").style.display = "none";
            alarmStatus.textContent = "状态异常";
            document.getElementById("top-bar").style.backgroundColor = "red";
            document.getElementById("sidebar").style.backgroundColor = "rgb(232, 192, 192)";
            document.getElementById("content").style.backgroundColor = "rgb(248, 155, 155)";
            document.getElementById("app").style.backgroundColor = "rgb(248, 155, 155)";
            document.getElementById("sidebar-menu").style.backgroundColor = "rgb(232, 192, 192)";
            document.getElementById("main").style.backgroundColor = "rgb(248, 155, 155)";
            document.getElementById("sidebar-menu").style.color = "rgb(110, 110, 110)";
            document.getElementById("sidebar-title").style.color = "rgb(110, 110, 110)";
            window.setModal(true, "警告", r.createElement('p', null, "土壤的pH值超出界限"))
        } else if (window.alarmStatus === 0) {
            // 添加这行代码来显示正常图标
            document.getElementById("alarm-ok-icon").style.display = "block";
            alarmOkDiv.style.display = "block";
            // 添加这行代码来隐藏警告图标
            document.getElementById("alarm-warn-icon").style.display = "none";
            alarmWarnDiv.style.display = "none";
            alarmStatus.textContent = "状态正常";
        } else {
            alarmOkDiv.style.display = "none";
            alarmWarnDiv.style.display = "none";
            alarmStatus.textContent = "状态获取失败";
        }
    })
    .catch(error => {
        window.alarmStatus = "状态获取失败"; // 更新全局变量
        console.error("请求失败:", error);
        const alarmStatus = document.getElementById("alarm-status");
        if (alarmStatus) {
            alarmStatus.textContent = window.alarmStatus; // 使用全局变量
        } else {
            console.error("未找到alarm-status元素");
        }
        
    });
}
// 监听菜单项的点击事件
// document.getElementById('sidebar-menu').addEventListener('click', function(e) {
//     if (e.target.closest('.ant-menu-item')) {
//         alert('点击了菜单项: ' + e.target.key);
//     }
// });
// const dashboardCards = document.getElementsByClassName("dashboard-card");
// for (let i = 0; i < dashboardCards.length; i++) {
//     const dashboardCard = dashboardCards[i];
//     dashboardCard.addEventListener("mouseenter", function () {
//         dashboardCard.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
//     });
//     dashboardCard.addEventListener("mouseleave", function () {
//         dashboardCard.style.boxShadow = "none";
//     });
// }


// alarmToggle ? window.onload = function () {
//     const alarmStatus = document.getElementById("alarm-status");
//     const alarmLoading = document.getElementById("alarm-loading");
//     if (alarmStatus && alarmLoading) {
//         alarmStatus.textContent = "此设置<a onclick='location.reload()'>刷新</a>后生效";
//         alarmLoading.style.display = "none";
//     } else {
//         console.warn("未找到alarm-status或alarm-loading元素");
//     }
// } : null;
