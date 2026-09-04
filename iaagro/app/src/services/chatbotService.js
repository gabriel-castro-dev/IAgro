import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

class ChatbotService {
  constructor() {
    // A chave é do OpenRouter (ver .env.example). Mantém o nome legado da env.
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.apiUrl = process.env.REACT_APP_OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
    this.model = process.env.REACT_APP_OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
    this.lastRequestTime = 0;
    this.minDelayBetweenRequests = 5000; // 5 segundos entre requisições
    this.retryCount = 0;
    this.maxRetries = 3;
    
    console.log('🔑 API Key configurada:', this.apiKey ? 'SIM ✅' : 'NÃO ❌');
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelayBetweenRequests) {
      const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
      console.log(`⏳ Aguardando ${Math.round(waitTime / 1000)}s para evitar rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async sendMessageToAI(userId, message, isRetry = false) {
    try {
      // Falha rápida e clara se a chave não estiver configurada
      if (!this.apiKey) {
        throw new Error('Chave da IA não configurada. Defina REACT_APP_GEMINI_API_KEY (chave OpenRouter) no arquivo .env');
      }

      if (!isRetry) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🤖 Enviando mensagem');
        console.log('👤 User ID:', userId);
      }

      // Aguardar para evitar rate limit
      await this.waitForRateLimit();

      // Buscar dados do usuário
      const fullUserContext = await this.getFullUserContext(userId);
      
      if (!isRetry) {
        console.log('━━━━━━━━━ CONTEXTO COMPLETO ━━━━━━━━━');
        console.log(fullUserContext.substring(0, 500) + '...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }

      const messages = [
        {
          role: 'system',
          content: fullUserContext
        },
        {
          role: 'user',
          content: message
        }
      ];

      const requestBody = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
      };

      console.log('📤 Enviando para OpenRouter...');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'IAgro'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Status:', response.status);

      // Tratamento especial para Rate Limit (429)
      if (response.status === 429) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
          const waitTime = 10000 * this.retryCount; // 10s, 20s, 30s
          console.warn(`⚠️ Rate limit atingido! Tentativa ${this.retryCount}/${this.maxRetries}`);
          console.log(`⏳ Aguardando ${waitTime / 1000}s antes de tentar novamente...`);
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          console.log('🔄 Tentando novamente...');
          return await this.sendMessageToAI(userId, message, true);
        } else {
          this.retryCount = 0;
          throw new Error('Limite de requisições atingido. Por favor, aguarde alguns minutos e tente novamente.');
        }
      }

      // Resetar contador de tentativas em caso de sucesso
      this.retryCount = 0;

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText };
        }
        
        console.error('❌ Erro da API:', errorData);
        throw new Error(errorData.error?.message || errorData.message || 'Erro na API');
      }

      const data = JSON.parse(responseText);
      const aiResponse = data?.choices?.[0]?.message?.content;

      if (!aiResponse) {
        console.error('❌ Resposta sem conteúdo:', data);
        throw new Error('A IA não retornou resposta. Tente novamente.');
      }

      console.log('✅ Resposta recebida com sucesso!');

      await this.saveChatMessage(userId, message, aiResponse);

      return {
        success: true,
        data: {
          response: aiResponse,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ ERRO:', error.message);
      
      return {
        success: false,
        error: error.message || 'Erro ao processar mensagem'
      };
    }
  }

  async getFullUserContext(userId) {
    try {
      // 1. Buscar dados do perfil (mesma coleção usada pelo profileService/UserRepository)
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // 2. Buscar histórico de atividades.
      // Consulta apenas por userId (sem orderBy) para não exigir índice composto no Firestore;
      // a ordenação por data e o limite são feitos em memória.
      const historicoRef = collection(db, 'agronomicalData');
      const historicoQuery = query(
        historicoRef,
        where('userId', '==', userId)
      );

      const historicoSnapshot = await getDocs(historicoQuery);
      const historicoData = historicoSnapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
        .slice(0, 5);
      
      console.log(`📊 ${historicoData.length} registros encontrados`);

      // 3. Construir contexto otimizado (mais curto)
      const contexto = `Você é o Assistente IAgro, especialista agrícola brasileiro.

📋 PERFIL:
Nome: ${userData.nomeCompleto || 'Não informado'}
Local: ${userData.cidade || 'N/A'}, ${userData.estado || 'N/A'}

🌾 HISTÓRICO (${historicoData.length} registros):
${historicoData.length > 0 ? historicoData.map((item, i) => 
`${i + 1}. ${item.tipoCultura || 'N/A'} | Solo: ${item.tipoSolo || 'N/A'} | Rend: ${item.rendimentoFinal || 'N/A'} | Data: ${item.dataPlantio || 'N/A'}`
).join('\n') : 'Sem histórico cadastrado. Oriente o usuário a cadastrar em "Meus Dados".'}

🎯 INSTRUÇÕES:
- Responda em português brasileiro, prático e objetivo
- Use emojis (🌾 🌱 ☀️ 💧 📊)
- Se houver histórico, analise e dê sugestões específicas
- Se não houver, oriente a cadastrar dados
- Tom: Profissional mas amigável`;

      return contexto;
    } catch (error) {
      console.error('❌ Erro ao buscar contexto:', error);
      return `Você é um assistente agrícola brasileiro. Responda de forma amigável e prática.`;
    }
  }

  async saveChatMessage(userId, userMessage, aiResponse) {
    try {
      await addDoc(collection(db, 'chatHistory'), {
        userId,
        userMessage,
        aiResponse,
        timestamp: new Date(),
        model: 'openrouter-gemini'
      });
      console.log('💾 Mensagem salva');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
    }
  }

  async getChatHistory(userId, limitCount = 20) {
    try {
      // Consulta só por userId (sem orderBy) para dispensar índice composto;
      // ordena por timestamp e limita em memória.
      const chatRef = collection(db, 'chatHistory');
      const q = query(chatRef, where('userId', '==', userId));

      const snapshot = await getDocs(q);
      const docs = snapshot.docs
        .map(d => ({ id: d.id, data: d.data() }))
        .filter(d => d.data.timestamp)
        .sort((a, b) => (b.data.timestamp?.seconds || 0) - (a.data.timestamp?.seconds || 0))
        .slice(0, limitCount);

      const messages = [];

      docs.forEach(({ id, data }) => {
        messages.push(
          {
            id: `${id}-user`,
            text: data.userMessage,
            sender: 'user',
            timestamp: data.timestamp.toDate()
          },
          {
            id: `${id}-ai`,
            text: data.aiResponse,
            sender: 'ai',
            timestamp: data.timestamp.toDate()
          }
        );
      });

      return {
        success: true,
        data: messages.reverse()
      };
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export const chatbotService = new ChatbotService();