import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; // Certifique-se de que o caminho está correto

export default function FunilProspeccao() {
  // --- CONFIGURAÇÃO DO WHATSAPP DO FUNIL ---
  // Digite aqui o número do segundo chip (o número de Vendas/Prospecção) com DDD.
  const WHATSAPP_VENDAS = "91984463181"; 

  // --- ESTADOS DO FUNIL ---
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [respostas, setRespostas] = useState({});
  const [dadosLead, setDadosLead] = useState({ nome: '', telefone: '' });
  
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null); // 'aprovado' ou 'reprovado'
  const [tipoDireito, setTipoDireito] = useState(''); // 'Aposentadoria Rural', 'Urbana' ou 'BPC/LOAS'

  // --- CAPTURA A FILIAL PELA URL (Ex: meusuite.com/triagem?unidade=2) ---
  const urlParams = new URLSearchParams(window.location.search);
  const filialId = parseInt(urlParams.get('unidade')) || 1;

  // --- AS PERGUNTAS DO QUIZ ---
  const perguntas = {
    1: {
      titulo: "Vamos descobrir se você tem direito a algum benefício! Primeiro, você é:",
      campo: "genero",
      opcoes: [
        { label: "👨 Homem", valor: "Homem" },
        { label: "👩 Mulher", valor: "Mulher" }
      ]
    },
    2: {
      titulo: "Qual é a sua idade hoje?",
      campo: "idade",
      opcoes: [
        { label: "Abaixo de 55 anos", valor: "<55" },
        { label: "De 55 a 59 anos", valor: "55-59" },
        { label: "De 60 a 64 anos", valor: "60-64" },
        { label: "65 anos ou mais", valor: ">=65" }
      ]
    },
    3: {
      titulo: "Qual foi o seu principal tipo de trabalho durante a vida?",
      campo: "trabalho",
      opcoes: [
        { label: "🌾 Sempre na Roça / Lavoura / Pesca", valor: "Rural" },
        { label: "🏙️ Sempre na Cidade (Urbano)", valor: "Urbana" },
        { label: "🔄 Um pouco na roça e um pouco na cidade", valor: "Misto" },
        { label: "🏠 Apenas Dona de Casa / Nunca trabalhei fora", valor: "Dona de Casa" }
      ]
    },
    4: {
      titulo: "Você tem 15 anos ou mais de trabalho comprovado? (Carteira assinada, carnê do INSS ou bloco de produtor rural)",
      campo: "tempo",
      opcoes: [
        { label: "✅ Sim, tenho 15 anos ou mais.", valor: ">=15" },
        { label: "❌ Não, tenho menos de 15 anos.", valor: "<15" },
        { label: "🤷 Não tenho certeza.", valor: "Não sei" }
      ]
    },
    // --- PERGUNTAS EXTRAS (APENAS PARA BPC/LOAS) ---
    5: {
      titulo: "Quantas pessoas moram debaixo do mesmo teto que você e fazem parte da sua família? (Cônjuge, pais, irmãos solteiros ou filhos solteiros)",
      campo: "pessoas_casa",
      opcoes: [
        { label: "Moro sozinho(a) (1 pessoa)", valor: "1" },
        { label: "2 pessoas", valor: "2" },
        { label: "3 pessoas", valor: "3" },
        { label: "4 pessoas ou mais", valor: "4+" }
      ]
    },
    6: {
      titulo: "Somando o que TODO MUNDO ganha, qual é a renda total da casa por mês?",
      campo: "renda_total",
      opcoes: [
        { label: "❌ Não entra nada (Renda Zero)", valor: "Zero" },
        { label: "💵 Até 1 salário mínimo", valor: "<=1" },
        { label: "💵💵 De 1 a 2 salários mínimos", valor: "1-2" },
        { label: "💵💵💵 Mais de 2 salários mínimos", valor: ">2" }
      ]
    },
    7: {
      titulo: "Esse dinheiro que entra na casa vem de aposentadoria, pensão ou benefício (BPC) de ALGUM OUTRO idoso(a) (acima de 65 anos) ou pessoa com deficiência?",
      campo: "exclusao_renda",
      opcoes: [
        { label: "✅ Sim, vem de outro idoso(a) ou deficiente.", valor: "Sim" },
        { label: "❌ Não, vem de trabalho comum ou pensão comum.", valor: "Não" }
      ]
    },
    8: {
      titulo: "A sua família tem gastos ALTOS todos os meses que pesam muito no bolso?",
      campo: "gastos_medicos",
      opcoes: [
        { label: "💊 Sim! Gastamos muito com remédios, fraldas ou médicos.", valor: "Sim" },
        { label: "👍 Não, nossos gastos com saúde são baixos.", valor: "Não" }
      ]
    }
  };

  // --- MOTOR DE DECISÃO ---
  const processarResposta = (campo, valor) => {
    const novasRespostas = { ...respostas, [campo]: valor };
    setRespostas(novasRespostas);

    // Se estiver na etapa 4, avalia Aposentadoria primeiro
    if (etapaAtual === 4) {
      const { genero, idade, trabalho, tempo } = novasRespostas;
      let aprovado = false;
      let tDireito = '';

      if (tempo === '>=15') {
        // Regras Rurais
        if (trabalho === 'Rural' || trabalho === 'Misto') {
          if (genero === 'Mulher' && (idade === '55-59' || idade === '60-64' || idade === '>=65')) { aprovado = true; tDireito = 'Aposentadoria Rural'; }
          if (genero === 'Homem' && (idade === '60-64' || idade === '>=65')) { aprovado = true; tDireito = 'Aposentadoria Rural'; }
        }
        // Regras Urbanas (Generoso: aceitando 60+ para mulheres e 65+ para homens)
        if (!aprovado && (trabalho === 'Urbana' || trabalho === 'Misto' || trabalho === 'Dona de Casa')) {
          if (genero === 'Mulher' && (idade === '60-64' || idade === '>=65')) { aprovado = true; tDireito = 'Aposentadoria Urbana'; }
          if (genero === 'Homem' && idade === '>=65') { aprovado = true; tDireito = 'Aposentadoria Urbana'; }
        }
      }

      if (aprovado) {
        setTipoDireito(tDireito);
        setEtapaAtual(9); // Pula direto para a captura de Lead
        return;
      } else if (idade === '>=65') {
        // Não tem tempo, mas tem idade: Vai para as perguntas do LOAS
        setEtapaAtual(5);
        return;
      } else {
        // Sem tempo e sem idade
        setResultado('reprovado');
        return;
      }
    }

    // Se estiver na etapa 8, avalia o BPC/LOAS
    if (etapaAtual === 8) {
      const { renda_total, exclusao_renda, gastos_medicos } = novasRespostas;
      let aprovado = true;

      // O único cenário de descarte total é renda muito alta SEM idoso para descontar e SEM gastos médicos para relativizar
      if (renda_total === '>2' && exclusao_renda === 'Não' && gastos_medicos === 'Não') {
        aprovado = false;
      }

      if (aprovado) {
        setTipoDireito('BPC/LOAS ao Idoso');
        setEtapaAtual(9); // Pula para a captura de Lead
      } else {
        setResultado('reprovado');
      }
      return;
    }

    // Avança para a próxima etapa normalmente
    setEtapaAtual(etapaAtual + 1);
  };

  // --- FINALIZAÇÃO: SALVA O LEAD NO SUPABASE ---
  const finalizarCadastro = async () => {
    if (!dadosLead.nome || dadosLead.telefone.length < 10) {
      return alert("⚠️ Por favor, preencha o seu nome e WhatsApp corretamente para prosseguirmos.");
    }

    setCarregando(true);

    // Formata o dossiê para a equipe
    const descDossie = `🤖 [TRIAGEM AUTOMÁTICA - FUNIL WEB]
Resultado: 🟢 Possível Direito a ${tipoDireito}

📋 Resumo das Respostas do Cliente:
👤 Gênero: ${respostas.genero || '-'}
🎂 Idade: ${respostas.idade || '-'}
💼 Perfil de Trabalho: ${respostas.trabalho || '-'}
⏳ Tempo de Contribuição: ${respostas.tempo || '-'}
${respostas.pessoas_casa ? `🏠 Grupo Familiar: ${respostas.pessoas_casa} pessoas` : ''}
${respostas.renda_total ? `💵 Renda Total: ${respostas.renda_total}` : ''}
${respostas.exclusao_renda ? `🚫 Desconto Legal (Outro Idoso/Deficiente): ${respostas.exclusao_renda}` : ''}
${respostas.gastos_medicos ? `💊 Altos Gastos Médicos: ${respostas.gastos_medicos}` : ''}

*Aviso ao Atendente:* Cliente triado automaticamente pela página. Entre em contato rápido para fechamento!`;

    const { error } = await supabase.from('tarefas').insert([{
      cliente_nome: `[LEAD] ${dadosLead.nome}`,
      cliente_telefone: dadosLead.telefone,
      descricao: descDossie,
      tipo: 'Prospecção Leads',       // O Tipo novo que criamos!
      origem_prospeccao: 'leads',     // A coluna nova!
      status: 'Pendente',
      responsavel: 'Equipe de Vendas',
      criado_por: 'Funil Automático',
      prazo: new Date().toISOString(),
      escritorio_id: filialId
    }]);

    setCarregando(false);

    if (!error) {
      setResultado('aprovado');
    } else {
      alert("Houve um erro na conexão. Tente novamente.");
    }
  };

  // --- MÁSCARA TELEFONE NO CADASTRO ---
  const handleTelefone = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    setDadosLead({ ...dadosLead, telefone: v });
  };

  // =========================================================================
  // RENDERIZAÇÃO DAS TELAS
  // =========================================================================

  // TELA DE DESCARTE (NÃO TEM DIREITO)
  if (resultado === 'reprovado') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconCircleRed}>❌</div>
          <h2 style={styles.tituloSecundario}>Infelizmente, ainda não é o momento.</h2>
          <p style={styles.texto}>
            Avaliamos as suas respostas com muito carinho. De acordo com as regras atuais do INSS, <strong>verificamos que você ainda não preenche os requisitos mínimos</strong> para a concessão do benefício neste momento.
          </p>
          <p style={styles.texto}>
            Isso é normal! As leis mudam e o tempo passa. Continue guardando os seus documentos e, no futuro, tente novamente. Agradecemos a sua confiança!
          </p>
        </div>
      </div>
    );
  }

  // TELA DE SUCESSO E REDIRECIONAMENTO WHATSAPP
  if (resultado === 'aprovado') {
    const linkWhats = `https://wa.me/55${WHATSAPP_VENDAS}?text=Olá! Acabei de fazer a triagem no site, me chamo ${dadosLead.nome} e vi que tenho chances de conseguir o benefício. Podemos conversar?`;
    
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconCircleGreen}>🎉</div>
          <h2 style={styles.tituloSecundario}>Ótimas Notícias, {dadosLead.nome}!</h2>
          <p style={styles.texto}>
            As suas respostas foram analisadas e você <strong>tem grandes chances</strong> de conseguir o seu benefício ({tipoDireito})!
          </p>
          <p style={styles.texto}>
            A nossa equipe de especialistas já recebeu o seu perfil. Clique no botão abaixo para falar conosco no WhatsApp agora mesmo e dar o próximo passo!
          </p>
          <a href={linkWhats} target="_blank" rel="noreferrer" style={styles.btnWhatsapp}>
            💬 Falar com um Especialista no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // TELA DE CAPTURA DO LEAD (Etapa 9)
  if (etapaAtual === 9) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.tituloPrincipal}>Estamos quase lá! 🤩</h2>
          <p style={styles.texto}>O sistema encontrou um caminho para o seu caso. Precisamos apenas do seu nome e WhatsApp para te mostrarmos o resultado.</p>
          
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={styles.label}>Qual o seu nome ou apelido?</label>
            <input 
              style={styles.input} 
              placeholder="Digite seu nome..." 
              value={dadosLead.nome} 
              onChange={e => setDadosLead({...dadosLead, nome: e.target.value})}
            />
          </div>
          <div style={{ marginBottom: '25px', textAlign: 'left' }}>
            <label style={styles.label}>Qual o seu WhatsApp com DDD?</label>
            <input 
              style={styles.input} 
              placeholder="(00) 00000-0000" 
              value={dadosLead.telefone} 
              onChange={handleTelefone}
              maxLength="15"
            />
          </div>
          
          <button onClick={finalizarCadastro} disabled={carregando} style={styles.btnAcao}>
            {carregando ? '⏳ Processando...' : '🔍 Ver meu Resultado'}
          </button>
        </div>
      </div>
    );
  }

  // TELA DAS PERGUNTAS (Etapas 1 a 8)
  const perguntaObj = perguntas[etapaAtual];
  if (!perguntaObj) return null; // Segurança

  const progresso = (etapaAtual / 8) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Barra de Progresso */}
        <div style={styles.barraFundo}>
          <div style={{ ...styles.barraProgresso, width: `${progresso}%` }}></div>
        </div>
        <span style={styles.textoProgresso}>Passo {etapaAtual > 4 ? etapaAtual - 4 : etapaAtual}</span>

        <h2 style={styles.tituloPergunta}>{perguntaObj.titulo}</h2>
        
        <div style={styles.areaBotoes}>
          {perguntaObj.opcoes.map((op, idx) => (
            <button 
              key={idx} 
              onClick={() => processarResposta(perguntaObj.campo, op.valor)}
              style={styles.btnOpcao}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ESTILIZAÇÃO (CSS INLINE LIMPO E MODERNO)
// =========================================================================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    animation: 'fadeIn 0.5s'
  },
  barraFundo: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '5px',
    overflow: 'hidden'
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: '#1e3a8a',
    transition: 'width 0.4s ease'
  },
  textoProgresso: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '20px',
    textAlign: 'right'
  },
  tituloPergunta: {
    fontSize: '20px',
    color: '#111827',
    marginBottom: '30px',
    lineHeight: '1.4'
  },
  areaBotoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  btnOpcao: {
    padding: '16px 20px',
    fontSize: '16px',
    color: '#374151',
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  tituloPrincipal: {
    fontSize: '24px',
    color: '#1e3a8a',
    marginBottom: '15px'
  },
  tituloSecundario: {
    fontSize: '22px',
    color: '#111827',
    marginBottom: '15px',
    marginTop: '15px'
  },
  texto: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.5',
    marginBottom: '20px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f9fafb',
    boxSizing: 'border-box',
    outline: 'none'
  },
  btnAcao: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(29, 78, 216, 0.2)'
  },
  btnWhatsapp: {
    display: 'block',
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    backgroundColor: '#25D366',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'none',
    boxSizing: 'border-box'
  },
  iconCircleRed: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    fontSize: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  iconCircleGreen: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    color: '#10b981',
    fontSize: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  }
};