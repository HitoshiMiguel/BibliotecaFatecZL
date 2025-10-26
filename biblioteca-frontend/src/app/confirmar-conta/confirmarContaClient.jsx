// Ex: app/confirmar-conta/page.jsx (Versão Simplificada para Debug)

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ConfirmarContaPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    // Estado apenas para mostrar feedback simples
    const [feedback, setFeedback] = useState('A processar confirmação...');

    useEffect(() => {
        console.log("ConfirmarContaPage: useEffect iniciado.");

        // Função async auto-executável dentro do useEffect
        (async () => {
            // Tenta ler o token diretamente dos searchParams AQUI
            const token = searchParams.get('token');
            console.log("ConfirmarContaPage: Token lido da URL:", token);

            if (!token) {
                console.error("ConfirmarContaPage: ERRO - Token ausente na URL.");
                setFeedback('ERRO: Token de confirmação inválido ou ausente na URL.');
                // Tenta redirecionar após um tempo, mesmo com erro
                setTimeout(() => {
                    console.log("ConfirmarContaPage: Redirecionando para login (token ausente)...");
                    router.push('/login');
                }, 3000);
                return; // Para a execução
            }

            try {
                console.log("ConfirmarContaPage: Chamando API /confirmar-conta com token:", token);
                const response = await fetch('http://localhost:4000/api/auth/confirmar-conta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token }), // Envia apenas o token
                });
                console.log("ConfirmarContaPage: Resposta da API status:", response.status);

                // Tenta ler o JSON mesmo que a resposta não seja OK
                let data = {};
                try {
                     data = await response.json();
                } catch (jsonError) {
                     console.error("ConfirmarContaPage: Erro ao ler JSON da resposta:", jsonError);
                     // Define uma mensagem de erro genérica se não conseguir ler
                     data = { message: `Erro ${response.status} ao processar a resposta do servidor.`};
                }


                if (response.ok) {
                    console.log("ConfirmarContaPage: API retornou sucesso. Mensagem:", data.message);
                    setFeedback('E-mail confirmado com sucesso! Redirecionando para login...');
                    setTimeout(() => {
                        console.log("ConfirmarContaPage: Redirecionando para login (sucesso)...");
                        router.push('/login');
                    }, 2000); // Redireciona após 2 segundos
                } else {
                    console.error("ConfirmarContaPage: API retornou erro:", response.status, data.message);
                    setFeedback(`ERRO: ${data.message || 'Não foi possível confirmar a conta.'}`);
                    setTimeout(() => {
                        console.log("ConfirmarContaPage: Redirecionando para login (erro API)...");
                        router.push('/login');
                    }, 4000); // Dá mais tempo para ler o erro antes de redirecionar
                }

            } catch (error) {
                console.error("ConfirmarContaPage: Erro CRÍTICO no fetch:", error);
                setFeedback('ERRO: Falha de conexão ao tentar confirmar a conta.');
                setTimeout(() => {
                    console.log("ConfirmarContaPage: Redirecionando para login (erro fetch)...");
                    router.push('/login');
                }, 4000);
            }
        })(); // Chama a função async imediatamente

    // A dependência agora é só o router, pois lemos searchParams diretamente
    }, [router, searchParams]); 

    // Estilos inline muito básicos
    const styles = {
        container: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '50px auto', padding: '30px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' },
        feedback: { marginTop: '20px', padding: '15px', borderRadius: '5px', fontWeight: 'bold' },
        loading: { color: '#555', fontStyle: 'italic'},
        error: { color: '#721c24', backgroundColor: '#f8d7da' },
        success: { color: '#155724', backgroundColor: '#d4edda' }
    };

    // Determina o estilo da mensagem de feedback
    let feedbackStyle = styles.loading;
    if (feedback.startsWith('ERRO:')) feedbackStyle = styles.error;
    else if (feedback.includes('sucesso')) feedbackStyle = styles.success;


    return (
        <div style={styles.container}>
            <h1>Confirmação de Conta</h1>
            <div style={{...styles.feedback, ...feedbackStyle}}>
                {feedback}
            </div>
            {/* Adiciona um botão manual caso o redirect automático falhe */}
            <button onClick={() => router.push('/login')} style={{padding: '10px 20px', marginTop: '20px', cursor: 'pointer'}}>
                Ir para Login Manualmente
            </button>
        </div>
    );
}