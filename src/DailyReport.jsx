import './dailyReport.css'
import danantaraLogo from './assets/danantara.png'
import pertaminaLogo from './assets/pertamina.png'

export default function DailyReport() {
  return (
    <div className="daily-report-body">
      <div className="dashboard-container">
        {/* TOP HEADER */}
        <div className="top-banner">
          <div className="logo-left">
            <img src={danantaraLogo} alt="Danantara Indonesia" className="logo-img" />
          </div>
          <div className="banner-title">DAILY REPORT LOC II</div>
          <div className="logo-right">
            <img src={pertaminaLogo} alt="Pertamina Patra Niaga" className="logo-img" />
          </div>
        </div>

        {/* DATE BAR */}
        <div className="date-bar">
          <div className="flex items-center gap-2">
            <span className="font-bold">Tanggal:</span>
            <span>Sabtu, 17 Oktober 2026</span>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="main-grid">
          {/* LEFT COLUMN */}
          <div className="left-col">
            {/* KAPASITAS FEED + HOS II + TANK FARM + CPI */}
            <div className="card card-feed">
              <div className="card-title">KAPASITAS FEED</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '16%' }}>UNIT</th>
                    <th style={{ width: '16%' }}>Status</th>
                    <th style={{ width: '12%' }}>Design (T/D)</th>
                    <th style={{ width: '12%' }}>Aktual (T/D)</th>
                    <th style={{ width: '14%' }}>Target RPH (T/D)</th>
                    <th style={{ width: '12%' }}>Target STS</th>
                    <th style={{ width: '9%' }}>% PRH</th>
                    <th style={{ width: '9%' }}>% STS</th>
                  </tr>
                </thead>
                <tbody>
                  {/* UNIT 021 */}
                  <tr>
                    <td className="text-center">UNIT 021 HVU II</td>
                    <td className="text-center text-green">Normal Operasi</td>
                    <td className="text-center">3883</td>
                    <td className="text-center">2583</td>
                    <td className="text-center">2524</td>
                    <td className="text-center">2524</td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>102.4</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>102.4</span>
                      </div>
                    </td>
                  </tr>
                  {/* UNIT 022 */}
                  <tr>
                    <td className="text-center">UNIT 022 PDU II</td>
                    <td className="text-center text-green">Normal Operasi</td>
                    <td className="text-center">784</td>
                    <td className="text-center">635</td>
                    <td className="text-center">627</td>
                    <td className="text-center">549</td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>101.3</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>115.8</span>
                      </div>
                    </td>
                  </tr>
                  {/* UNIT 023 */}
                  <tr>
                    <td className="text-center">UNIT 023 FEU II</td>
                    <td rowSpan={2} className="text-center text-green">
                      Normal Operasi
                    </td>
                    <td rowSpan={2} className="text-center">
                      2270
                    </td>
                    <td rowSpan={2} className="text-center">
                      1750
                    </td>
                    <td rowSpan={2} className="text-center">
                      1476
                    </td>
                    <td rowSpan={2} className="text-center">
                      1476
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>118.6</span>
                      </div>
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>118.6</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">MMO</td>
                  </tr>
                  {/* UNIT 024 */}
                  <tr>
                    <td className="text-center">UNIT 024 MDU II</td>
                    <td rowSpan={2} className="text-center text-green">
                      Normal Operasi
                    </td>
                    <td rowSpan={2} className="text-center">
                      841
                    </td>
                    <td rowSpan={2} className="text-center">
                      561
                    </td>
                    <td rowSpan={2} className="text-center">
                      547
                    </td>
                    <td rowSpan={2} className="text-center">
                      547
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>102.6</span>
                      </div>
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>102.6</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">LMO</td>
                  </tr>

                  {/* HOS II SUB-TABLE */}
                  <tr>
                    <th>UNIT</th>
                    <th>Status</th>
                    <th>Pompa HOS</th>
                    <th>Aktual (T/D)</th>
                    <th>Burner FG/FO</th>
                    <th colSpan={3}>Level 023C104</th>
                  </tr>
                  <tr>
                    <td className="text-center">HOS II</td>
                    <td className="text-center text-green">Normal Operasi</td>
                    <td className="text-center">025P101AT</td>
                    <td className="text-center">23808</td>
                    <td className="text-center">12 Gas / 4 Oil</td>
                    <td colSpan={3} className="text-center">
                      1.4
                    </td>
                  </tr>

                  {/* TANK FARM & CPI SUB-TABLE */}
                  <tr>
                    <th>UNIT</th>
                    <th>Produksi (MTon)</th>
                    <th>Flow HVI 95</th>
                    <th>Flow HVI 160S</th>
                    <th>Flow HVI 650</th>
                    <th>Level CPI (%)</th>
                    <th colSpan={2}>VISUAL PERAIRAN</th>
                  </tr>
                  <tr>
                    <td rowSpan={2} className="text-center">
                      Tank Farm
                    </td>
                    <td className="text-center font-bold">LOC II</td>
                    <td className="text-center">465</td>
                    <td className="text-center">0</td>
                    <td className="text-center">0</td>
                    <td className="text-center">22.0</td>
                    <td colSpan={2} className="text-center">
                      CLEAR
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">LOC III</td>
                    <td className="text-center">0</td>
                    <td className="text-center">0</td>
                    <td className="text-center">256</td>
                    <th colSpan={3}>STATUS POMPA CPI</th>
                  </tr>
                  <tr>
                    <th colSpan={2}>Stock Product (MTon)</th>
                    <th>HVI 95</th>
                    <th>HVI 160S</th>
                    <th>HVI 650</th>
                    <th>002P101A</th>
                    <th colSpan={2}>002P101B</th>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-center font-bold">
                      Tank Farm
                    </td>
                    <td className="text-center">2951</td>
                    <td className="text-center">1048</td>
                    <td className="text-center">3481</td>
                    <td className="text-center">Perbaikan</td>
                    <td colSpan={2} className="text-center">
                      AUTO
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ISSUE OPERASIONAL */}
            <div className="card card-operasional">
              <div className="card-title">ISSUE OPERASIONAL</div>
              <div className="operational-box">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Unit FEU II 023 : Ketahanan stock furfural</li>
                  <li>024K-101 : Temperature discharge panas &amp; ASC hunting</li>
                  <li>021F-102 : Flow fuel gas max 197 M3/h</li>
                </ol>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* PRODUKSI */}
            <div className="card card-produksi">
              <div className="card-title">PRODUKSI</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>UNIT</th>
                    <th style={{ width: '16%' }}>Produk</th>
                    <th style={{ width: '11%' }}>AKTUAL</th>
                    <th style={{ width: '48%' }}>ANALISA SAMPLE</th>
                    <th style={{ width: '10%' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {/* UNIT 021 HVU II */}
                  <tr>
                    <td rowSpan={4} className="text-center">
                      UNIT 021 HVU II
                    </td>
                    <td>
                      SPO DIST
                      <br />
                      <span className="font-bold">LOC I</span>
                    </td>
                    <td className="text-center">250 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="text-green">12.50</span>
                        <span className="font-bold">cSt</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>
                  <tr>
                    <td>
                      LMO DIST
                      <br />
                      <span className="font-bold">041T-116</span>
                    </td>
                    <td className="text-center">273 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="text-green">31.21</span>
                        <span className="font-bold">cSt</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>
                  <tr>
                    <td>
                      MMO DIST
                      <br />
                      <span className="font-bold">041T-117</span>
                    </td>
                    <td className="text-center">460 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="text-green">95.75</span>
                        <span className="font-bold">cSt</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>
                  <tr>
                    <td>
                      SHORT RESIDUE
                      <br />
                      <span className="font-bold">041T-121/310</span>
                    </td>
                    <td className="text-center">1081 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="text-green">1166.00</span>
                        <span className="font-bold">cSt</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>

                  {/* UNIT 022 PDU II */}
                  <tr>
                    <td rowSpan={2} className="text-center">
                      UNIT 022 PDU II
                    </td>
                    <td>
                      DAO
                      <br />
                      <span className="font-bold">041T-115</span>
                    </td>
                    <td className="text-center">151 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span className="text-green">43.81</span>
                        <span className="text-green">288</span>
                        <span className="text-green">L7.5</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>
                  <tr>
                    <td>
                      ASPHALT
                      <br />
                      <span className="font-bold">42T-10</span>
                    </td>
                    <td className="text-center">484 T/D</td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* UNIT 023 FEU II */}
                  <tr>
                    <td rowSpan={2} className="text-center">
                      UNIT 023 FEU II
                    </td>
                    <td>
                      RAFFINATE
                      <br />
                      <span className="font-bold">41T-315</span>
                    </td>
                    <td className="text-center">1106 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">RI</span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span className="text-green">14.960</span>
                        <span className="text-green">262</span>
                        <span className="text-green">1.4861</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>
                  <tr>
                    <td>
                      EXTRACT
                      <br />
                      <span className="font-bold">IFO</span>
                    </td>
                    <td className="text-center">644 T/D</td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* UNIT 024 MDU II */}
                  <tr>
                    <td rowSpan={2} className="text-center">
                      UNIT 024 MDU II
                    </td>
                    <td>
                      DOR
                      <br />
                      <span className="font-bold">41T-102</span>
                    </td>
                    <td className="text-center">465 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        <span className="font-bold">VI</span>
                        <span className="font-bold">PP</span>
                        <span className="font-bold">App</span>
                        <span className="text-green">7.007</span>
                        <span className="text-green">214</span>
                        <span className="text-green">L1.0</span>
                        <span className="text-green">99</span>
                        <span className="text-green">-9</span>
                        <span className="text-green">C&amp;B</span>
                      </div>
                    </td>
                    <td className="onspec-cell">(OnSpec)</td>
                  </tr>
                  <tr>
                    <td>
                      SLACK WAX
                      <br />
                      <span className="font-bold">RFCC</span>
                    </td>
                    <td className="text-center">96 T/D</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FEU / MDU / NOTE SUMMARY TABLE */}
            <div className="card card-summary">
              <table>
                <thead>
                  <tr>
                    <th
                      style={{
                        background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)',
                        color: '#fff',
                      }}
                    ></th>
                    <th
                      colSpan={3}
                      style={{
                        background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)',
                        color: '#fff',
                      }}
                    >
                      FEU
                    </th>
                    <th
                      colSpan={3}
                      style={{
                        background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)',
                        color: '#fff',
                      }}
                    >
                      MDU
                    </th>
                    <th
                      style={{
                        background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)',
                        color: '#fff',
                      }}
                    >
                      NOTE
                    </th>
                  </tr>
                  <tr>
                    <th>Grade</th>
                    <th>Design (T/D)</th>
                    <th>STS (%)</th>
                    <th>RPH (%)</th>
                    <th>Design (T/D)</th>
                    <th>STS (%)</th>
                    <th>RPH (%)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold">LMO</td>
                    <td className="text-center font-bold">2180</td>
                    <td className="text-center font-bold">70</td>
                    <td rowSpan={3} className="text-center font-bold">
                      65
                    </td>
                    <td className="text-center font-bold">841</td>
                    <td className="text-center font-bold">65</td>
                    <td rowSpan={3} className="text-center font-bold">
                      65
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">MMO</td>
                    <td className="text-center font-bold">2270</td>
                    <td className="text-center font-bold">65</td>
                    <td className="text-center font-bold">777</td>
                    <td className="text-center font-bold">65</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">DAO</td>
                    <td className="text-center font-bold">1786</td>
                    <td className="text-center font-bold">70</td>
                    <td className="text-center font-bold">501</td>
                    <td className="text-center font-bold">0</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ISSUE MAINTENANCE */}
            <div className="card card-maintenance">
              <div className="card-title">ISSUE MAINTENANCE</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Equipment</th>
                    <th style={{ width: '25%' }}>Issue</th>
                    <th style={{ width: '55%' }}>Mitigasi / RTL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center">024P-107A</td>
                    <td>Motor vibrasi</td>
                    <td>Perbaikan motor di WS bls ( WO No. 8302570004 )</td>
                  </tr>
                  <tr>
                    <td className="text-center">002P-101A</td>
                    <td>Casing bocor</td>
                    <td>Perbaikan pompa di WS bls</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

