# SoilFrontPanel
### 开发者：“智壤魔探”开源项目开发组
一个轻量级基于React的土壤检测面板（需要自行搭建后端）

[English](https://github.com/EdaphosynthTeam/SoilFrontPanel/blob/main/README.md) | 中文

![GitHub Stars](https://img.shields.io/github/stars/EdaphosynthTeam/SoilFrontPanel?style=for-the-badge) 


注意：
- 某些功能需自行购买硬件并配置后端后才能使用，若没有条件，可运行`/test`文件夹下的代码，进行测试
- 本项目使用MIT许可证，商用请注明出处并保留原作者信息
- 项目目前处于测试阶段，可能存在一些不可言喻的问题，欢迎提出建议和反馈（issue）

## 功能说明
- **AI总结**<br>
在后端配置好后 ***（您可以借鉴`/test`文件夹下的测试用后端代码）*** ，可以打开部署后的`index.html`，在`系统设置`界面开启AI总结功能，AI会根据当前土壤情况进行总结，并给出建议
- **警报系统**<br>
在`系统设置`界面开启警报系统，当土壤情况超出设定范围时，会开启预警
- **数据记录**（需稍作修改和配置后端）<br>
在`仪表盘`中，可以直接看到历史数据；
另外，您还可以在在`调试`菜单中点击**导出日志**按钮，可以导出当前土壤情况数据，并保存为zip
- **数据可视化**<br>
基于[AntV/G2](https://g2.antv.antgroup.com/)的数据可视化，您可在`仪表盘`中看见***可视化图表***

##### 团队制作不易，如果对您有帮助，请点个star（星标），谢谢！
