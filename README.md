# SoilFrontPanel
A lightweight React-based soil monitoring dashboard (requires custom backend deployment).


English | [中文](https://github.com/EdaphosynthTeam/SoilFrontPanel/blob/main/docs/readme_zh-CN.md)

![GitHub Stars](https://img.shields.io/github/stars/EdaphosynthTeam/SoilFrontPanel?style=for-the-badge) 


Note:
- Some features require you to purchase hardware and configure the backend to use them. If you don't have the conditions, you can run the code under the `/test` folder for testing.
- This project uses the MIT license. For commercial use, please indicate the source and retain the original author information.
- The project is currently in the testing phase and there may be some unspeakable problems. Suggestions and feedback (issue) are welcome.

## Features
- **AI Summary**<br>
After configuring the backend ***(you can refer to the test backend code under the `/test` folder)***, you can open the deployed `index.html` and enable the AI summary function in the `System Settings` interface. The AI will summarize the current soil conditions and provide suggestions.
- **Alarm System**<br>
Enable the alarm system in the `System Settings` interface. When the soil conditions exceed the set range, an alarm will be triggered.
- **Data Recording** (requires slight modification and backend configuration)<br>
In the `Dashboard`, you can directly see the historical data;
In addition, you can click the **Export Log** button in the `Debug` menu to export the current soil condition data and save it as a zip file.
- **Data Visualization**<br>
Based on [AntV/G2](https://g2.antv.antgroup.com/) data visualization, you can see ***visualization charts*** in the `Dashboard`.

##### The team worked hard to create this. If it helps you, please give it a star, thank you!
