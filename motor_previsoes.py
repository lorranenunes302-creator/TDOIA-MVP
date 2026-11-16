"""Motor local para novas inferências e cenários do MVP TDOIA.
Reconstrução independente baseada nas variáveis disponíveis; não homologa ou reproduz
necessariamente as estimativas do protótipo original.
"""
from functools import lru_cache
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder,StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

ROOT=Path(__file__).resolve().parent

@lru_cache(maxsize=1)
def marketing_model():
    df=pd.read_csv(ROOT/'originais'/'ml_project1_data.csv')
    df=df.dropna(subset=['Income']).query('Income <= 600000 and Year_Birth >= 1940').copy()
    df['Idade']=2014-df['Year_Birth']
    dt=pd.to_datetime(df['Dt_Customer'],format='%Y-%m-%d',errors='coerce')
    df['Tempo_cliente']=(dt.max()-dt).dt.days
    df['Filhos']=df['Kidhome']+df['Teenhome']
    excluded=['ID','Response','Z_CostContact','Z_Revenue','Year_Birth','Dt_Customer']
    X=df.drop(columns=excluded,errors='ignore')
    cats=[c for c in X if X[c].dtype=='object']
    nums=[c for c in X if c not in cats]
    prep=ColumnTransformer([('num',Pipeline([('fill',SimpleImputer(strategy='median')),('scale',StandardScaler())]),nums),('cat',Pipeline([('fill',SimpleImputer(strategy='most_frequent')),('encode',OneHotEncoder(handle_unknown='ignore'))]),cats)])
    model=Pipeline([('prep',prep),('lr',LogisticRegression(max_iter=2500,random_state=42))])
    y=df['Response'].astype(int)
    x_train,x_test,y_train,y_test=train_test_split(X,y,test_size=.25,random_state=42,stratify=y)
    model.fit(x_train,y_train)
    prob=model.predict_proba(x_test)[:,1]
    auc=float(roc_auc_score(y_test,prob))
    # Retreinamento integral para fazer inferências novas em TODOS os registros existentes
    model.fit(X,y)
    full_prob=model.predict_proba(X)[:,1]
    summary=pd.DataFrame({'prob':full_prob,'response_historica':y.to_numpy()}).sort_values('prob',ascending=False)
    return {'model':model,'base':df,'X':X,'summary':summary,'auc_test':auc,'test_rows':len(x_test)}

def marketing(opts):
    pct=float(opts.get('percentual',20)); cost=float(opts.get('custo',3)); revenue=float(opts.get('receita',11))
    if not 1<=pct<=100 or not 0<=cost<=10000 or not 0<=revenue<=10000:raise ValueError('Parâmetros fora dos limites permitidos.')
    o=marketing_model(); ranked=o['summary']; n=max(1,int(round(len(ranked)*pct/100)))
    subset=ranked.head(n)
    estimated_conv=float(subset['prob'].sum())
    expected_profit=float(revenue*estimated_conv-cost*n)
    bins=[]
    for p in range(5,101,5):
        m=max(1,int(round(len(ranked)*p/100))); est=float(ranked.head(m)['prob'].sum())
        bins.append({'pct':p,'contatos':m,'aceites_estimados':round(est,1),'lucro_estimado':round(revenue*est-cost*m,2)})
    return {'tipo':'predicao_modelo','modelo':'Regressão Logística treinada localmente na base iFood (reconstrução)',
      'registros':len(ranked),'auc_teste_reconstrucao':round(o['auc_test'],4), 'percentual':pct,'contatos':n,
      'conversoes_estimadas':round(estimated_conv,1),'taxa_estimada_pct':round(estimated_conv/n*100,2),
      'lucro_estimado_um':round(expected_profit,2),'curva':bins,
      'aviso':'Inferência nova sobre a base histórica, usando probabilidades de um modelo treinado nela. Não é validação fora da amostra, não é efeito incremental ou causal. AUC foi calculada em conjunto de teste separado ANTES do retreinamento com a base completa.'}

@lru_cache(maxsize=1)
def finance_df():
    f=pd.read_excel(ROOT/'originais'/'financial_sample.xlsx',keep_default_na=False)
    f.columns=f.columns.str.strip()
    for col in ['Sales','Profit','Units Sold','Discounts','COGS','Sale Price','Gross Sales']:
        f[col]=pd.to_numeric(f[col],errors='coerce').fillna(0)
    f['Date']=pd.to_datetime(f['Date'])
    return f

def vendas(opts):
    # Baseline de previsão de volume experimental; não declarado confiável
    f=finance_df().copy()
    country=str(opts.get('pais','Todos'))
    product=str(opts.get('produto','Todos'))
    if country!='Todos':f=f[f.Country==country]
    if product!='Todos':f=f[f.Product==product]
    if f.empty: raise ValueError('Nenhum registro no filtro escolhido.')
    grp=f.groupby(f.Date.dt.to_period('M'))['Units Sold'].sum().sort_index()
    n=max(1,min(6,int(opts.get('meses',3))))
    # Projeta por média simples dos últimos três meses observados, NÃO é uma previsão aprovada
    base=float(grp.iloc[-min(3,len(grp)):].mean())
    last=grp.index.max();pred=[{'mes':str(last+i),'unidades_projetadas':round(base,1)} for i in range(1,n+1)]
    return {'tipo':'projecao_experimental','metodo':'Média dos últimos 3 meses disponíveis no filtro',
      'registros_filtrados':len(f),'ultimos_meses':[{'mes':str(m),'unidades':round(float(v),1)} for m,v in grp.tail(8).items()],
      'projecoes':pred,'aviso':'Projeção exploratória: os modelos de vendas não demonstraram desempenho preditivo suficiente. Não utilize como previsão confiável.'}

def financeiro(opts):
    f=finance_df().copy(); seg=str(opts.get('segmento','Todos'));country=str(opts.get('pais','Todos'))
    if seg!='Todos': f=f[f.Segment==seg]
    if country!='Todos':f=f[f.Country==country]
    if f.empty:raise ValueError('Nenhum registro para a seleção.')
    discount=float(opts.get('desconto',0));elast=float(opts.get('elasticidade',1))
    if not 0<=discount<=50 or not 0<=elast<=5:raise ValueError('Parâmetros fora dos limites permitidos.')
    # Hipótese explícita: desconto adicional percentual sobre preço vendido, alteração de volume proporcional à elasticidade
    factor=max(0,1+elast*(discount/100))
    scenario_sales=float(f['Sales'].sum())*(1-discount/100)*factor
    scenario_cogs=float(f['COGS'].sum())*factor
    profit=scenario_sales-scenario_cogs
    return {'tipo':'simulacao_hipotetica','registros':len(f),'receita_atual':round(float(f.Sales.sum()),2),
      'lucro_atual':round(float(f.Profit.sum()),2),'receita_cenario':round(scenario_sales,2),'lucro_cenario':round(profit,2),
      'variacao_lucro':round(profit-float(f.Profit.sum()),2),'fator_volume':round(factor,4),
      'aviso':'Simulação hipotética, não previsão de comportamento de consumidores. A elasticidade inserida não foi estimada da Financial Sample. Impostos, custos fixos e efeitos comerciais adicionais não modelados.'}

@lru_cache(maxsize=1)
def fiscal_series():
    from scripts.indicadores_arrecadacao import compute
    r=compute(ROOT/'originais'/'arrecadacao_por_uf.csv')
    return pd.Series({pd.Timestamp(x['mes']+'-01'):float(x['valor']) for x in r['serie_mensal']}).sort_index()

def fiscal(opts):
    months=int(opts.get('meses',3));growth_factor=float(opts.get('ajuste_crescimento',0))
    if not 1<=months<=12 or not -30<=growth_factor<=30:raise ValueError('Parâmetros fora dos limites permitidos.')
    s=fiscal_series();growth=(s/s.shift(12)-1).replace([np.inf,-np.inf],np.nan).dropna().tail(12).mean()
    growth=float(growth)+growth_factor/100
    preds=[]
    for k in range(1,months+1):
        month=s.index[-1]+pd.DateOffset(months=k)
        lag=s.get(month-pd.DateOffset(years=1))
        if lag is None or pd.isna(lag):raise ValueError('Referência sazonal insuficiente.')
        preds.append({'mes':month.strftime('%Y-%m'),'valor_estimado_bilhoes':round(float(lag*(1+growth))/1e9,2)})
    return {'tipo':'previsao_modelo_reconstruido','metodo':'Ingênuo sazonal com crescimento médio dos 12 últimos meses históricos',
      'ultimo_mes_base':s.index[-1].strftime('%Y-%m'),'crescimento_aplicado_pct':round(growth*100,3),'previsoes':preds,
      'aviso':'Nova previsão prospectiva reconstruída com dados até julho/2026. Incerteza histórica observada: MAPE entre 3,4% e 17,3%; use como referência, não como valor garantido.'}

def run(agent,options):
    functions={'marketing':marketing,'vendas':vendas,'financeiro':financeiro,'fiscal':fiscal}
    if agent not in functions:raise ValueError('Agente sem ferramenta de previsão.')
    return functions[agent](options)
