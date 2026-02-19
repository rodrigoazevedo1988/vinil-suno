import React from 'react';
import { ArrowLeft, ScrollText, ShieldCheck } from 'lucide-react';

interface TermsViewProps {
    onBack: () => void;
}

const TermsView: React.FC<TermsViewProps> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            <header className="space-y-4 border-b border-white/10 pb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-4">
                    <ScrollText className="w-10 h-10 text-brand" />
                    Termos de Uso
                </h1>
                <p className="text-zinc-500 text-lg">Última atualização: 18 de Fevereiro de 2026</p>
            </header>

            <div className="prose prose-invert prose-lg max-w-none text-zinc-300">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        1. Introdução
                    </h2>
                    <p>
                        Bem-vindo ao <strong>Vinil Suno</strong>. Ao acessar e usar nossa plataforma de streaming e gerenciamento de músicas, você concorda com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, por favor, não utilize nossos serviços.
                    </p>
                </section>

                <section className="space-y-4 mt-8">
                    <h2 className="text-2xl font-bold text-white">2. Uso da Plataforma</h2>
                    <p>
                        O Vinil Suno é uma plataforma destinada ao armazenamento, transmissão e organização de arquivos de áudio pessoais e gerados por IA. Você concorda em usar o serviço apenas para fins legais e de acordo com todas as leis aplicáveis.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                        <li>Você é responsável por manter a confidencialidade da sua conta e senha.</li>
                        <li>Não é permitido usar o serviço para distribuir conteúdo ilegal ou protegido por direitos autorais sem autorização.</li>
                        <li>Reservamo-nos o direito de suspender contas que violem estas regras.</li>
                    </ul>
                </section>

                <section className="space-y-4 mt-8">
                    <h2 className="text-2xl font-bold text-white">3. Conteúdo do Usuário</h2>
                    <p>
                        Ao fazer upload de músicas ou imagens para o Vinil Suno, você declara que possui os direitos necessários sobre esse conteúdo. Nós não reivindicamos propriedade sobre o seu conteúdo, mas precisamos de licença para armazená-lo e executá-lo para você.
                    </p>
                </section>

                <section className="space-y-4 mt-8">
                    <h2 className="text-2xl font-bold text-white">4. Privacidade</h2>
                    <p>
                        Sua privacidade é importante para nós. Coletamos apenas os dados necessários para o funcionamento do serviço (nome, email e arquivos enviados). Não compartilhamos seus dados com terceiros sem seu consentimento.
                    </p>
                </section>

                <section className="space-y-4 mt-8">
                    <h2 className="text-2xl font-bold text-white">5. Limitação de Responsabilidade</h2>
                    <p>
                        O serviço é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. Não nos responsabilizamos por perdas de dados decorrentes de falhas no sistema, embora façamos backups regulares.
                    </p>
                </section>

                <section className="space-y-4 mt-8 border-t border-white/10 pt-8">
                    <div className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/10">
                        <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Segurança e Dados</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Utilizamos criptografia para proteger suas senhas e conexão segura (HTTPS). Seus arquivos são armazenados de forma privada, acessíveis apenas por você ou conforme suas configurações de playlist.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TermsView;
